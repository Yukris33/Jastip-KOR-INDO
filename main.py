
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
import models
import schemas
from database import Base, engine, get_db

# Membuat database tables sesuai dengan models.py
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Jastip Manager API")

app.add_middleware( #access https 5173
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Mengizinkan frontend dari mana saja untuk akses
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MODEL BISNIS: satu Fee Jastip (%) saja, default 11%.
# CATATAN KOMPATIBILITAS: nama tax_percent/tax_idr tetap dipakai di API & DB lama.
# Nilainya dalam project ini adalah FEE JASTIP, BUKAN pajak pemerintah.
def attach_product_prices(product, tax_percent=11.0):
    modal_idr = product.price_idr  # Modal = KRW x kurs; sudah tersimpan di products
    product.tax_percent = tax_percent  # Nama field lama, artinya Fee Jastip (%)
    product.tax_idr = round(modal_idr * tax_percent / 100, 2)  # Fee satu kali
    product.total_tagihan_idr = round(modal_idr + product.tax_idr, 2)  # Modal + fee
    return product


@app.get("/")
def read_root():
    return {"status": "online", "message": "Backend Jastip Manager is ready!"}


# ==========================================
# ENDPOINTS: STORE
# ==========================================

@app.post("/stores/", response_model=schemas.StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(store: schemas.StoreCreate, db: Session = Depends(get_db)):
    db_store = models.Store(name=store.name, location=store.location)
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

@app.get("/stores/", response_model=List[schemas.StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    return db.query(models.Store).all()


# ==========================================
# ENDPOINTS: CATEGORY
# ==========================================

@app.post("/categories/", response_model=schemas.CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/categories/", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


# ==========================================
# ENDPOINTS: PRODUCT
# ==========================================

#post untuk membuat/menambahkan data
@app.post("/products/", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: schemas.ProductCreate, tax_percent: float = 11.0, db: Session = Depends(get_db)):
    # 1. Validasi Keberadaan Category jika dikirim
    if product.category_id is not None:
        category = db.query(models.Category).filter(models.Category.id == product.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail=f"Category with id {product.category_id} not found")

    # 2. Validasi Keberadaan Store jika dikirim
    if product.store_id is not None:
        store = db.query(models.Store).filter(models.Store.id == product.store_id).first()
        if not store:
            raise HTTPException(status_code=404, detail=f"Store with id {product.store_id} not found")
        
    # 3. Hitung Kurs & Simpan ke DB
    product_data = product.model_dump() #model_dump() 
    #untuk mengubah Pydantic model menjadi dict (Atribut dalam sebuah skema pydantic terbawa)
    price_idr = product.price_krw * product.exchange_rate
    product_data["price_idr"] = price_idr #otomatis ke kurs harganya

    db_product = models.Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return attach_product_prices(db_product, tax_percent)  # Modal + satu fee jastip

#mengambil/melihat data
@app.get("/products/", response_model=List[schemas.ProductResponse])
def get_products(tax_percent: float = 11.0, category_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product)
    if category_id:
        query = query.filter(models.Product.category_id == category_id)
    
    products = query.all()

    # Hitung satu fee jastip sesuai tax_percent (nama API lama) dari frontend
    return [attach_product_prices(p, tax_percent) for p in products]  # Hitung harga tiap produk

#put mengupdate data


@app.put("/products/{product_id}", response_model=schemas.ProductResponse)
def update_product(
    product_id: int,
    product: schemas.ProductUpdate,
    db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(
        models.Product.id == product_id).first()  # Cari produk berdasarkan ID

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )  # Tolak jika produk tidak ditemukan

    update_data = product.model_dump(exclude_unset=True)  # Ambil data yang dikirim saja

    for field in ("name", "price_krw", "exchange_rate"):
        if field in update_data and update_data[field] is None:
            raise HTTPException(status_code=422,detail=f"{field} tidak boleh null"
            )  # Field wajib tidak boleh null

    for key, value in update_data.items():
        setattr(db_product, key, value)  # Ubah atribut sesuai request

    if "price_krw" in update_data or "exchange_rate" in update_data:
        db_product.price_idr = (db_product.price_krw * db_product.exchange_rate
        )  # Hitung ulang harga modal IDR

    db.commit()  # Simpan perubahan ke PostgreSQL
    db.refresh(db_product)  # Ambil ulang data terbaru

    return attach_product_prices(db_product)  # Estimasi modal + fee jastip default 11%



@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(db_product)
    db.commit()
    return None


# ==========================================
# ENDPOINTS: ORDER MANAGEMENT
# ==========================================

@app.post("/orders/", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order_data: schemas.OrderCreate, db: Session = Depends(get_db)):
    """
    Membuat order dengan snapshot modal harga produk. Total = modal + Fee Jastip.
    Tidak menambah markup kedua atau pajak pemerintah.
    """
    if not order_data.items:
        raise HTTPException(status_code=400, detail="Order items cannot be empty")

    new_order = models.Order(
        customer_name=order_data.customer_name,
        status=order_data.status or models.OrderStatus.PENDING,
        total_krw=0.0,
        total_idr=0.0,
        tax_idr=0.0
    )
    db.add(new_order)
    db.flush() #mengirim data ke database sementara (draft)

    total_krw = 0.0
    subtotal_idr = 0.0

    
    for item in order_data.items:
        product = db.query(models.Product).filter(
            models.Product.id == item.product_id
        ).first()  # Cari produk sesuai ID di database

        if not product:
            db.rollback()  # Batalkan transaksi jika produk tidak ditemukan
            raise HTTPException(
                status_code=404,
                detail=f"Product with id {item.product_id} not found"
            )

        unit_price_idr = product.price_idr  # Harga satuan modal IDR, tanpa markup ganda
        item_total_krw = product.price_krw * item.quantity  # Subtotal KRW
        item_total_idr = unit_price_idr * item.quantity  # Subtotal modal IDR

        total_krw += item_total_krw  # Akumulasi harga KRW semua item
        subtotal_idr += item_total_idr  # Akumulasi modal IDR semua item

        order_item = models.OrderItem(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price_krw_at_purchase=product.price_krw,  # Snapshot harga Korea
            price_idr_at_purchase=unit_price_idr  # Snapshot modal IDR saat pemesanan
        )
        db.add(order_item)  # Simpan item ke transaksi, belum commit

    # Sesudah loop: kenakan hanya SATU fee jastip pada subtotal modal.
    fee_percent = order_data.tax_percent if order_data.tax_percent is not None else 11.0  # Nama field API masih tax_percent
    fee_idr = round(subtotal_idr * fee_percent / 100.0, 2)  # Nominal fee jastip

    new_order.total_krw = total_krw  # Total seluruh barang (KRW)
    new_order.tax_idr = fee_idr  # Kolom lama tax_idr dipakai untuk fee jastip
    new_order.total_idr = round(subtotal_idr + fee_idr, 2)  # Modal + satu fee

    db.commit()  # Simpan order dan semua order item sekaligus
    db.refresh(new_order)  # Ambil ulang data order
    return new_order  # Kirim hasil ke frontend

@app.get("/orders/", response_model=List[schemas.OrderResponse])
def get_orders(status_filter: Optional[schemas.OrderStatusEnum] = None, db: Session = Depends(get_db)):
    """
    Mengambil daftar order, opsional dengan filter status: GET /orders/?status_filter=PENDING
    """
    query = db.query(models.Order)
    if status_filter:
        query = query.filter(models.Order.status == status_filter)
    return query.all()


@app.patch("/orders/{order_id}", response_model=schemas.OrderResponse)
def edit_order(
    order_id: int,
    changes: schemas.OrderEdit,
    db: Session = Depends(get_db)
):
    db_order = db.query(models.Order).filter(
     models.Order.id == order_id).first()  # Cari order berdasarkan ID

    if db_order is None:
        raise HTTPException(status_code=404, detail="Order tidak ditemukan")

    update_data = changes.model_dump(exclude_unset=True)  # Hanya data yang dikirim

    if not update_data:
        raise HTTPException(status_code=422, detail="Tidak ada data yang diedit")

    if "status" in update_data:
        if update_data["status"] is None:
            raise HTTPException(status_code=422, detail="Status tidak boleh null")
        db_order.status = update_data["status"]  # Update status manual

    if "notes" in update_data:
        value = update_data["notes"]
        db_order.notes = value.strip() or None if value is not None else None  # Update notes

    
    # Edit platform dan nomor/username customer
    if "contact_platform" in update_data or "contact_value" in update_data:

        platform = update_data.get("contact_platform", db_order.contact_platform)

        contact = update_data.get("contact_value", db_order.contact_value)

        # Rapikan input kontak
        contact = contact.strip() if contact is not None else None
        contact = contact or None

        # Platform dan kontak harus sama-sama terisi atau kosong
        if bool(platform) != bool(contact):
            raise HTTPException(
                status_code=422,
                detail="Platform dan nomor/username harus diisi bersama"
            )

        db_order.contact_platform = platform  # Update platform
        db_order.contact_value = contact  # Update nomor/username


    db.commit()  # Simpan perubahan ke PostgreSQL
    db.refresh(db_order)  # Ambil data terbaru

    return db_order  # Kirim hasil edit ke React



@app.patch("/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, status_data: schemas.OrderStatusUpdate, db: Session = Depends(get_db)):
    """
    Mengubah status order (misal dari PENDING/BELUM BAYAR ke PAID/LUNAS).
    """
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")

    db_order.status = status_data.status
    db.commit()
    db.refresh(db_order)
    return db_order


@app.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """
    Menghapus record order dari rekapan pembayaran.
    """
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    db.delete(db_order)
    db.commit()
    return None
