USE aegis_insurance;

-- Password hash for all sample users is bcrypt("password")
INSERT INTO users (name, email, password, city, platform, weekly_income) VALUES
('Ravi Kumar', 'ravi@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.Hj5M6w6M5QfM9vDOMkMt2rt7NmBGG.', 'Mumbai', 'Swiggy', 8000.00),
('Anita Sharma', 'anita@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.Hj5M6w6M5QfM9vDOMkMt2rt7NmBGG.', 'Delhi', 'Zomato', 7200.00),
('Imran Ali', 'imran@example.com', '$2a$10$7EqJtq98hPqEX7fNZaFWoO.Hj5M6w6M5QfM9vDOMkMt2rt7NmBGG.', 'Mumbai', 'Rapido', 6500.00);

INSERT INTO policies (user_id, premium, coverage_percentage, start_date, status) VALUES
(1, 350.00, 30.00, '2026-03-01', 'active'),
(2, 300.00, 25.00, '2026-03-05', 'active'),
(3, 280.00, 20.00, '2026-03-10', 'active');

INSERT INTO events (city, rainfall, aqi, event_date, triggered) VALUES
('Mumbai', 75.00, 160.00, '2026-03-28', TRUE),
('Delhi', 10.00, 340.00, '2026-03-28', TRUE),
('Bangalore', 12.00, 90.00, '2026-03-28', FALSE);

INSERT INTO wallets (user_id, balance) VALUES
(1, 0.00),
(2, 0.00),
(3, 0.00);
