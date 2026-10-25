-- =====================================================================
--  HP Bank  -  MySQL database (Banking Management System)
--  How to use:  mysql -u root -p < database.sql
--  (or open this file in phpMyAdmin / MySQL Workbench and run it)
--
--  NOTE: Demo passwords use SHA2 only to keep the project simple.
--  In the backend (next semester) use bcrypt / password_hash() instead.
-- =====================================================================

DROP DATABASE IF EXISTS hpbank;
CREATE DATABASE hpbank CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hpbank;

-- ---------------------------------------------------------------------
-- 1. USERS  (customer, employee and admin all log in from this table)
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(80)  NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  phone         CHAR(10)     NOT NULL,
  city          VARCHAR(50),
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','employee','admin') NOT NULL DEFAULT 'customer',
  status        ENUM('active','blocked') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------
-- 2. ACCOUNTS  (one user can have Savings / Current / FD accounts)
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  account_no  CHAR(10) NOT NULL UNIQUE,
  account_type ENUM('Savings','Current','FD') NOT NULL DEFAULT 'Savings',
  balance     DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  ifsc        VARCHAR(11) NOT NULL DEFAULT 'HPBK0001001',
  status      ENUM('active','blocked') NOT NULL DEFAULT 'active',
  opened_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_acc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chk_balance CHECK (balance >= 0)
);

-- ---------------------------------------------------------------------
-- 3. TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  txn_code           VARCHAR(20) UNIQUE,
  account_id         INT NOT NULL,
  txn_type           ENUM('credit','debit') NOT NULL,
  amount             DECIMAL(12,2) NOT NULL,
  description        VARCHAR(120),
  category           VARCHAR(30) NOT NULL DEFAULT 'general',   -- general / transfer / bill / loan
  related_account_no CHAR(10),
  balance_after      DECIMAL(12,2),
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_txn_acc FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT chk_amount CHECK (amount > 0),
  INDEX idx_txn_acc_date (account_id, created_at)
);

-- ---------------------------------------------------------------------
-- 4. BENEFICIARIES  (saved receivers)
-- ---------------------------------------------------------------------
CREATE TABLE beneficiaries (
  id                     INT AUTO_INCREMENT PRIMARY KEY,
  user_id                INT NOT NULL,
  beneficiary_name       VARCHAR(80) NOT NULL,
  beneficiary_account_no CHAR(10) NOT NULL,
  added_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_ben (user_id, beneficiary_account_no),
  CONSTRAINT fk_ben_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 5. LOANS
-- ---------------------------------------------------------------------
CREATE TABLE loans (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  loan_code     VARCHAR(10) UNIQUE,
  user_id       INT NOT NULL,
  account_id    INT NOT NULL,
  loan_type     ENUM('Home','Car','Personal','Education','Gold') NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  interest_rate DECIMAL(4,2)  NOT NULL,
  tenure_years  INT NOT NULL,
  emi           DECIMAL(12,2) NOT NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  applied_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  decided_by    INT NULL,
  decided_at    TIMESTAMP NULL,
  CONSTRAINT fk_loan_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_loan_acc  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT fk_loan_by   FOREIGN KEY (decided_by) REFERENCES users(id)    ON DELETE SET NULL
);

-- ---------------------------------------------------------------------
-- 6. NOTIFICATIONS
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  message    VARCHAR(200) NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 7. SCHEME_INVESTMENTS  (HP Double Dhamaka Yojana - DEMO joke scheme, fake money)
--    Invest an amount, get payout (2x) after 21 days. Not a real banking product.
-- ---------------------------------------------------------------------
CREATE TABLE scheme_investments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  scheme_code   VARCHAR(10) UNIQUE,
  user_id       INT NOT NULL,
  account_id    INT NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  payout        DECIMAL(12,2) NOT NULL,
  start_date    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  maturity_date TIMESTAMP NOT NULL,
  status        ENUM('active','claimed') NOT NULL DEFAULT 'active',
  claimed_at    TIMESTAMP NULL,
  CONSTRAINT fk_sch_user FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT fk_sch_acc  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  CONSTRAINT chk_sch_amt CHECK (amount >= 1000 AND amount <= 50000)
);

-- =====================================================================
--  SAMPLE DATA  (same demo users as the frontend)
--  Customer login: rahul@demo.com / 1234      Admin login: admin@demo.com / admin123
-- =====================================================================
INSERT INTO users (id, name, email, phone, city, password_hash, role) VALUES
 (1, 'Rahul Sharma', 'rahul@demo.com', '9876543210', 'Delhi',   SHA2('1234',256),     'customer'),
 (2, 'Priya Verma',  'priya@demo.com', '9812345678', 'Jaipur',  SHA2('1234',256),     'customer'),
 (3, 'Amit Singh',   'amit@demo.com',  '9898989898', 'Lucknow', SHA2('1234',256),     'customer'),
 (4, 'Bank Admin',   'admin@demo.com', '9000000000', 'Delhi',   SHA2('admin123',256), 'admin');

INSERT INTO accounts (id, user_id, account_no, account_type, balance) VALUES
 (1, 1, '1000000001', 'Savings', 45250.00),
 (2, 2, '1000000002', 'Savings', 82000.00),
 (3, 3, '1000000003', 'Current', 120500.00);

INSERT INTO transactions (txn_code, account_id, txn_type, amount, description, related_account_no, created_at) VALUES
 ('TXN100001', 1, 'credit', 50000, 'Opening deposit',               NULL,         NOW() - INTERVAL 90 DAY),
 ('TXN100002', 1, 'credit', 30000, 'Salary credit',                 NULL,         NOW() - INTERVAL 20 DAY),
 ('TXN100003', 1, 'debit',   1850, 'Bill: Electricity - UPPCL (4521780)',              NULL,         NOW() - INTERVAL 14 DAY),
 ('TXN100004', 1, 'debit',   5000, 'Cash withdrawal',               NULL,         NOW() - INTERVAL 10 DAY),
 ('TXN100005', 1, 'debit',   2400, 'Transfer to 1000000002 Rent',   '1000000002', NOW() - INTERVAL 6 DAY),
 ('TXN100006', 1, 'credit',  1500, 'Transfer from 1000000003 Refund','1000000003',NOW() - INTERVAL 4 DAY),
 ('TXN100007', 1, 'debit',    899, 'Bill: Mobile Recharge - Airtel (9876543210)',               NULL,         NOW() - INTERVAL 3 DAY),
 ('TXN100008', 1, 'debit',   3200, 'Grocery shopping',              NULL,         NOW() - INTERVAL 1 DAY),
 ('TXN100009', 2, 'credit', 82000, 'Opening deposit',               NULL,         NOW() - INTERVAL 60 DAY),
 ('TXN100010', 2, 'credit',  2400, 'Transfer from 1000000001 Rent', '1000000001', NOW() - INTERVAL 6 DAY),
 ('TXN100011', 3, 'credit',120500, 'Opening deposit',               NULL,         NOW() - INTERVAL 40 DAY),
 ('TXN100012', 3, 'debit',   1500, 'Transfer to 1000000001 Refund', '1000000001', NOW() - INTERVAL 4 DAY);

-- mark bill payments and recharges (the frontend writes them as "Bill: <service> - <provider> (<number>)")
UPDATE transactions SET category = 'bill'     WHERE id > 0 AND description LIKE 'Bill:%';
UPDATE transactions SET category = 'transfer' WHERE id > 0 AND description LIKE 'Transfer %';

INSERT INTO beneficiaries (user_id, beneficiary_name, beneficiary_account_no) VALUES
 (1, 'Priya Verma', '1000000002');

INSERT INTO loans (loan_code, user_id, account_id, loan_type, amount, interest_rate, tenure_years, emi, status, applied_at) VALUES
 ('LN1001', 2, 2, 'Home',      2500000, 8.50, 15, 24618.00, 'pending',  NOW() - INTERVAL 2 DAY),
 ('LN1002', 1, 1, 'Education',  300000, 9.00,  5,  6227.00, 'approved', NOW() - INTERVAL 30 DAY);

INSERT INTO scheme_investments (scheme_code, user_id, account_id, amount, payout, start_date, maturity_date, status) VALUES
 ('DD1001', 2, 2, 5000, 10000, NOW() - INTERVAL 5 DAY, NOW() + INTERVAL 16 DAY, 'active');

INSERT INTO notifications (user_id, message) VALUES
 (1, 'Welcome to HP Bank! Your account is active.'),
 (1, 'Your education loan LN1002 was approved.');

-- =====================================================================
--  VIEWS  (ready-made reports for the admin panel)
-- =====================================================================
CREATE VIEW vw_customer_accounts AS
SELECT u.id AS user_id, u.name, u.email, u.status AS user_status,
       a.account_no, a.account_type, a.balance
FROM users u JOIN accounts a ON a.user_id = u.id
WHERE u.role = 'customer';

CREATE VIEW vw_daily_summary AS
SELECT DATE(created_at) AS day,
       SUM(CASE WHEN txn_type='credit' THEN amount ELSE 0 END) AS total_credit,
       SUM(CASE WHEN txn_type='debit'  THEN amount ELSE 0 END) AS total_debit,
       COUNT(*) AS total_transactions
FROM transactions GROUP BY DATE(created_at);

-- =====================================================================
--  STORED PROCEDURE: safe money transfer
--  (both balances change together, or nothing changes)
--  Use later from backend:  CALL sp_transfer('1000000001','1000000002',500,'Rent');
-- =====================================================================
DELIMITER $$
CREATE PROCEDURE sp_transfer(
  IN p_from VARCHAR(10), IN p_to VARCHAR(10), IN p_amount DECIMAL(12,2), IN p_note VARCHAR(60))
BEGIN
  DECLARE v_from_id INT DEFAULT NULL;
  DECLARE v_to_id   INT DEFAULT NULL;
  DECLARE v_bal     DECIMAL(12,2) DEFAULT 0;
  DECLARE v_to_bal  DECIMAL(12,2) DEFAULT 0;
  DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK; RESIGNAL; END;

  START TRANSACTION;

  SELECT id, balance INTO v_from_id, v_bal
    FROM accounts WHERE account_no = p_from AND status = 'active' FOR UPDATE;
  SELECT id INTO v_to_id
    FROM accounts WHERE account_no = p_to AND status = 'active' FOR UPDATE;

  IF v_from_id IS NULL OR v_to_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid or blocked account';
  END IF;
  IF p_from = p_to THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cannot send money to the same account';
  END IF;
  IF p_amount <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Amount must be greater than zero';
  END IF;
  IF v_bal - p_amount < 500 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient balance (minimum 500 must remain)';
  END IF;

  UPDATE accounts SET balance = balance - p_amount WHERE id = v_from_id;
  UPDATE accounts SET balance = balance + p_amount WHERE id = v_to_id;
  SELECT balance INTO v_to_bal FROM accounts WHERE id = v_to_id;

  INSERT INTO transactions (txn_code, account_id, txn_type, amount, description, related_account_no, balance_after)
  VALUES (CONCAT('TXN', UNIX_TIMESTAMP(), FLOOR(RAND()*900)+100), v_from_id, 'debit', p_amount,
          CONCAT('Transfer to ', p_to, ' ', IFNULL(p_note,'')), p_to, v_bal - p_amount);
  INSERT INTO transactions (txn_code, account_id, txn_type, amount, description, related_account_no, balance_after)
  VALUES (CONCAT('TXN', UNIX_TIMESTAMP(), FLOOR(RAND()*900)+100), v_to_id, 'credit', p_amount,
          CONCAT('Transfer from ', p_from, ' ', IFNULL(p_note,'')), p_from, v_to_bal);

  COMMIT;
END$$
DELIMITER ;

-- Quick checks you can run:
-- SELECT * FROM vw_customer_accounts;
-- SELECT * FROM vw_daily_summary;
-- CALL sp_transfer('1000000001','1000000002',500,'Test');
