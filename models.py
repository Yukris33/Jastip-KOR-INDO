
import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import relationship
from database import Base

class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    SHIPPED = "SHIPPED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="store")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price_krw = Column(Float, nullable=False)
    price_idr = Column(Float, nullable=False)
    exchange_rate = Column(Float, nullable=False)
    image_url = Column(String, nullable=True)
    
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)\
        
    created_at = Column(DateTime, default=datetime.utcnow)
    markup_percent = Column(Float, nullable=False, default=0.0, server_default="0")  # Legacy; tidak dipakai di hitungan satu fee

    store = relationship("Store", back_populates="products")
    category = relationship("Category", back_populates="products")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total_krw = Column(Float, default=0.0)
    total_idr = Column(Float, default=0.0)
    tax_idr = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi 1 Order ke Banyak OrderItem
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    # Data kontak customer
    contact_platform = Column(String(30), nullable=True)  # WhatsApp, Instagram, LINE, TikTok
    contact_value = Column(String(100), nullable=True)  # Nomor atau username
    notes = Column(Text, nullable=True)  # Catatan customer


class OrderItem(Base):
    __tablename__ = "order_items"  # Nama tabel PostgreSQL

    id = Column(Integer, primary_key=True, index=True)  # ID item
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)  # ID order
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)  # ID produk
    quantity = Column(Integer, nullable=False, default=1)  # Jumlah barang

    price_krw_at_purchase = Column(Float, nullable=False)  # Snapshot harga KRW
    price_idr_at_purchase = Column(Float, nullable=False)  # Snapshot harga jual IDR

    order = relationship("Order", back_populates="items")  # Relasi order
    product = relationship("Product")  # Relasi produk
