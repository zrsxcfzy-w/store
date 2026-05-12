# MySQL 8 Database Design

This directory contains the v1 relational schema for the home inventory mini program.

## Scope

- Database: MySQL 8.
- Model style: normalized tables for users, houses, items, bills, locations, categories, units, and backups.
- Sharing: not included in v1. Revisit a `house_members` style table when household collaboration is planned.
- Delete behavior: physical delete for items and bills. Revisit soft delete before adding recycle bin, mistake recovery, household sharing, operation logs, or audit features.
- Pagination: mixed strategy. Bills and backups use cursor pagination; small dictionary lists do not paginate; items can load all records in v1.

## Files

- `schema.mysql.sql`: full DDL for the v1 schema.

## Cursor Pagination Examples

First bill page:

```sql
SELECT *
FROM bill_records
WHERE house_id = ?
ORDER BY bill_date DESC, id DESC
LIMIT ?;
```

Next bill page:

```sql
SELECT *
FROM bill_records
WHERE house_id = ?
  AND (bill_date < ? OR (bill_date = ? AND id < ?))
ORDER BY bill_date DESC, id DESC
LIMIT ?;
```

First backup page:

```sql
SELECT *
FROM store_backups
WHERE user_id = ?
ORDER BY created_at DESC, id DESC
LIMIT ?;
```

Next backup page:

```sql
SELECT *
FROM store_backups
WHERE user_id = ?
  AND (created_at < ? OR (created_at = ? AND id < ?))
ORDER BY created_at DESC, id DESC
LIMIT ?;
```

## Index Notes

- `idx_bills_house_date` supports the global bill list by house and cursor pagination.
- `idx_bills_item_date` supports one item's purchase history and cycle calculation.
- `idx_bills_item_price` supports one item's price ascending/descending sorting.
- `idx_items_house_filter` supports home page location and category filtering.
- `idx_items_house_reminder` supports low-stock and next-purchase reminder queries.
- `idx_backups_user_created` supports cloud backup list cursor pagination.

## Reminder For Future Upgrades

Before adding any of these features, discuss whether to introduce soft delete and operation logs:

- Recycle bin.
- Restore deleted items or bills.
- Household sharing.
- Audit trail.
- Operation history.
