-- Database structure
-- ~~~ bash
-- sqlite3 ./.data/db.sqlite < db_structure.sql 
-- ~~~


CREATE TABLE users (
    uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(128) NOT NULL,
    password VARCHAR(128) NOT NULL,
    first_name VARCHAR(256) NOT NULL,
    last_name VARCHAR(256) NOT NULL,
    address VARCHAR(1024) NOT NULL,
    phone VARCHAR(64) NOT NULL,
    allowed_orders INTEGER(1) NOT NULL DEFAULT 5,
    tos_agreement INTEGER(1) NOT NULL,
    deleted INTEGER(1) NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX email_UIDX ON users (email);
CREATE UNIQUE INDEX phone_UIDX ON users (phone);

CREATE TABLE tokens (
    uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user INTEGER NOT NULL,
    token VARCHAR(64) NOT NULL,
    expire_at DATETIME NOT NULL,
    deleted INTEGER(1) NOT NULL DEFAULT 0,
    FOREIGN KEY(user) REFERENCES users(uid)
);

CREATE TABLE items (
    uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    item VARCHAR(64) NOT NULL,
    id INTEGER NOT NULL,
    price FLOAT NOT NULL,
    description VARCHAR(256),
    active INTEGER(1) NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX id_UIDX ON items (id);

INSERT INTO items 
    (item, id, price, description)
VALUES
    ('Toast Bread', 116034, 1.4, 'White bread with sesam seeds.'),
    ('Tuna can', 569142, 2.4, 'Tuna in water, 150g.'),
    ('Tzatziki', 892672, 1.6, 'Greek tzatziki salad 250g.'),
    ('Milk 2L 3%', 722294, 2.1, 'Fresh milk in plastic botle 2 liters, 3% fat.'),
    ('Milk 1L 3%', 722295, 1.6, 'Fresh milk in plastic botle 1 liter, 3% fat.'),
    ('Smoked sausages', 870463, 4.7, 'Smoked spicy sausages, 150g.'),
    ('Potato chips', 157240, 0.75, 'Salted potato chips, 75g.'),
    ('Milk chocolate', 774922, 2.0, 'Milk chocolate, 100g.'),
    ('Roast coffee', 278977, 6.53, 'Packeted brasilian roast coffee, 200g.'),
    ('Liquid soap', 480238, 3.3, 'Almond liquid soap, 1 liter, plastic pack.'),
    ('Cookies', 346821, 1.2, 'Cookies with peanuts, 100g.'),
    ('Vanila icecream', 112391, 9.15, 'Vanila icecream, 2 liters.'),
    ('Frozen pees', 789300, 4.3, 'Frozen pees, 2kg.'),
    ('Sliced cheese', 811501, 2.5, 'Edam cheese, sliced, 250g.'),
    ('Chicken filet', 118390, 4.8, 'Chicken filet, 600g.'),
    ('Seabass fish', 528365, 12.6, 'Seabass fish, 1kg.'),
    ('Toilet paper', 240471, 8.6, 'Toilet paper, 3 layers, 12x pack.'),
    ('Apple vinegar', 893571, 5.8, 'Apple vinegar, 500ml.'),
    ('Tomato sauce', 992411, 1.3, 'Spiced tomato sauce, 200ml.'),
    ('Candys', 110034, 0.45, 'Sweet candys, 100g.')
;


CREATE TABLE orders (
    uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    user INTEGER NOT NULL,
    'order' INTEGER NOT NULL,
    paid INTEGER(1) NOT NULL DEFAULT 0,
    expire_at DATETIME NOT NULL,
    FOREIGN KEY(user) REFERENCES users(uid)
);
CREATE UNIQUE INDEX order_UIDX ON orders ('order');

CREATE TABLE order_items (
    uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    'order' INTEGER NOT NULL,
    item INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY('order') REFERENCES orders(uid),
    FOREIGN KEY(item) REFERENCES items(uid)
);

CREATE TABLE payments (
    uid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    'order' INTEGER NOT NULL,
    id INTEGER NOT NULL,
    total FLOAT NOT NULL DEFAULT .0,
    status VARCHAR(256),
    FOREIGN KEY('order') REFERENCES orders(uid)
);
