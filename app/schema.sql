-- Run this script in your PostgreSQL database to create the table

CREATE TABLE IF NOT EXISTS products (
    s_no SERIAL PRIMARY KEY,
    productid VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    image TEXT,
    weight DECIMAL(10, 2)
);

-- Sample Data
INSERT INTO products (productid, category, name, image, weight) VALUES
('n1', 'necklace', 'Classic Silver', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 15.50),
('n2', 'necklace', 'Gold Pearl', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 18.25),
('e1', 'earring', 'Silver Hoops', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 4.30),
('r1', 'ring', 'Diamond Ring', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 3.10),
('nc1', 'nethichutti', 'Bridal Nethichutti', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 22.00),
('m1', 'mookuthi', 'Gold Mookuthi', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 1.25),
('b1', 'bangle', 'Kundan Bangle', 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/necless-removebg-preview-eKz2jodGH8N7T3A6C0R7P8ArJP6J6b.png', 35.50)
ON CONFLICT (productid) DO NOTHING;