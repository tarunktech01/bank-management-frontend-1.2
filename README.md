# HP Bank - Banking Management System

**HP Bank = Hamara Paisa Bank**. Tagline: "Hamara Paisa, Hamara Bharosa".

Frontend (HTML, CSS, JavaScript) + MySQL database. Works on mobile, tablet and laptop.
The backend will be added next semester.

## Folder structure

```
bank/
  index.html        Home page
  login.html        Login + Open Account
  app.html          Customer app (dashboard, transfer, deposit/withdraw, history, loans, profile)
  admin.html        Admin panel (customers, transactions, loan approval)
  css/style.css     All design (colors, layout, dark mode, mobile)
  js/data.js        Demo data layer  (replace with backend later)
  js/app.js         Customer page logic
  js/admin.js       Admin page logic
  database.sql      MySQL tables + sample data + procedure
```

## How to run

1. Open the `bank` folder and double click `index.html` (or use VS Code "Live Server").
2. Login with a demo account:
   - Customer: `rahul@demo.com` / `1234`
   - Admin: `admin@demo.com` / `admin123`
3. Data is saved in the browser (localStorage). To reset everything, clear site data in the browser.

## How to import the MySQL database

```
mysql -u root -p < database.sql
```
or open `database.sql` in phpMyAdmin / MySQL Workbench and run it. It creates the database `hpbank`.

Tables: users, accounts, transactions, beneficiaries, loans, notifications, scheme_investments.
Extras: 2 views (reports) and a stored procedure `sp_transfer` for safe money transfer.

## How the backend will connect next semester

Right now every screen calls a function from the `Api` object in `js/data.js`
(for example `Api.login()`, `Api.transfer()`, `Api.applyLoan()`).
Next semester:

1. Create the backend (PHP or Node.js) with routes like `/api/login`, `/api/transfer`, `/api/loans`.
2. The backend connects to the MySQL database from `database.sql`.
3. In `js/data.js` change each function to use `fetch('/api/...')` instead of localStorage.
4. Store passwords with bcrypt / `password_hash()` (never plain text).

The HTML pages and design stay the same.

## Bills & Recharge (customer app)

Services: Mobile, DTH, FASTag, Electricity, Water, Gas, Broadband, Postpaid, Insurance, School/College fee.
- Recharge type (mobile, DTH, FASTag): choose operator, enter number, pick a plan or type an amount.
- Bill type (electricity, water...): enter the consumer number, click **Fetch Bill**, then pay.
- The amount is deducted from the account, saved in transaction history and a printable receipt is shown.
- Demo only: the bill amount is made up from the number typed. A real backend will fetch the real bill.

## HP Double Dhamaka Yojana (demo joke scheme)

Inspired by Hera Pheri. Invest Rs 1,000 to Rs 50,000 (multiples of Rs 500) and get 2x after 21 days.
- Fake money only. A real bank never promises to double money, and the app says so on the page and on the home banner.
- Flow: Join scheme, wait 21 days (progress bar), press **Claim** to receive the payout.
- For viva: the **Fast-forward 21 days** button skips the waiting so you can show the payout.
- Database table: `scheme_investments`.

## Rules in the demo

- Minimum balance of Rs 500 must always remain in the account.
- Admin approving a loan credits the loan amount to the customer.
- Blocked customers cannot log in.
