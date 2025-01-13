CREATE TABLE IF NOT EXISTS "Product" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10,2) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample laptop data
INSERT INTO "Product" ("name", "description", "price", "category") VALUES
('Dell Inspiron 15', '15.6" HD Display, Intel Core i5, 8GB RAM, 256GB SSD', 699.99, 'Laptops'),
('Lenovo IdeaPad 3', '14" FHD Display, AMD Ryzen 5, 8GB RAM, 512GB SSD', 549.99, 'Laptops'),
('HP Pavilion', '15.6" FHD Display, AMD Ryzen 7, 16GB RAM, 512GB SSD', 899.99, 'Laptops'),
('Acer Aspire 5', '15.6" FHD Display, Intel Core i3, 8GB RAM, 256GB SSD', 449.99, 'Laptops'),
('ASUS VivoBook 15', '15.6" FHD Display, Intel Core i5, 12GB RAM, 512GB SSD', 649.99, 'Laptops');
