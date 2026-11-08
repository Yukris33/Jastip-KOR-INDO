from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List, Literal
from datetime import datetime
import enum

# ==========================================
# SCHEMA CATEGORY
# ==========================================
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True


# ==========================================
# SCHEMA STORE
# ==========================================
class StoreBase(BaseModel):
    name: str
    location: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class StoreResponse(StoreBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# SCHEMA PRODUCT
# ==========================================
class ProductBase(BaseModel):
    name: str
    price_krw: float
    exchange_rate: float
    image_url: Optional[str] = None
    store_id: Optional[int] = None
    category_id: Optional[int] = None


class ProductCreate(ProductBase):
    price_krw: float = Field(gt=0, allow_inf_nan=False)  # Harga KRW harus positif
    exchange_rate: float = Field(gt=0, allow_inf_nan=False)  # Kurs harus positif

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price_krw: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)  # Harga valid saat edit
    exchange_rate: Optional[float] = Field(default=None, gt=0, allow_inf_nan=False)  # Validasi kurs saat edit
    # Exchange rate harus lebih besar dari 0
    image_url: Optional[str] = None
    store_id: Optional[int] = None
    category_id: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    created_at: Optional[datetime] = None
    price_idr: Optional[float] = None          # Harga Asli IDR
    tax_percent: Optional[float] = 11.0        # Nama API lama; Fee Jastip (%)
    tax_idr: Optional[float] = None            # Nama API lama; nominal Fee Jastip
    total_tagihan_idr: Optional[float] = None  # Modal + satu Fee Jastip


    class Config:
        from_attributes = True


# ==========================================
# SCHEMA ORDER & ORDER ITEM
# ==========================================
class OrderStatusEnum(str, enum.Enum): #enum untuk toleransi typo
    PENDING = "PENDING"
    PAID = "PAID"
    SHIPPED = "SHIPPED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class OrderItemCreate(BaseModel):
    product_id: int = Field(gt=0)  # ID produk harus lebih besar dari 0
    quantity: int = Field(gt=0)

class OrderCreate(BaseModel):
    customer_name: str = Field(min_length=1)  # Nama customer wajib diisi
    status: Optional[OrderStatusEnum] = OrderStatusEnum.PENDING  # Status awal pesanan
    tax_percent: Optional[float] = Field(  # Nama API lama: Fee Jastip 0–100%
        default=11.0, ge=0, le=100
    )
    # Order wajib punya minimal satu item
    items: List[OrderItemCreate] = Field(min_length=1)
    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, value: str) -> str:
        # Hapus spasi di awal dan akhir nama
        cleaned_name = value.strip()
        # Tolak kalau nama ternyata kosong
        if not cleaned_name:
            raise ValueError("Nama customer tidak boleh kosong")
        return cleaned_name


class OrderStatusUpdate(BaseModel):
    status: OrderStatusEnum

class OrderEdit(BaseModel):
    status: Optional[OrderStatusEnum] = None  # Status order
    notes: Optional[str] = Field(default=None, max_length=2000)  # Catatan

    contact_platform: Optional[
    Literal["whatsapp", "instagram", "line", "tiktok"]] = None  # Platform social media

    contact_value: Optional[str] = Field(
        default=None,
        max_length=100
    )  # Nomor atau username

    model_config = ConfigDict(extra="forbid")


class OrderItemResponse(BaseModel):
    id: Optional[int] = None
    product_id: int
    quantity: int
    price_krw_at_purchase: float
    price_idr_at_purchase: float

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(BaseModel):
    id: int  # ID order
    customer_name: str  # Nama pembeli

    contact_platform: Optional[str] = None  # WhatsApp, IG, LINE, TikTok
    contact_value: Optional[str] = None  # Nomor atau username
    notes: Optional[str] = None  # Catatan customer

    status: OrderStatusEnum  # Status pesanan
    total_krw: float  # Total harga KRW
    total_idr: float  # Total tagihan IDR

    tax_idr: Optional[float] = None  # Izinkan NULL pada order lama

    created_at: datetime  # Tanggal order
    items: List[OrderItemResponse]  # Daftar produk yang dipesan

    model_config = ConfigDict(from_attributes=True)  # Baca dari SQLAlchemy
