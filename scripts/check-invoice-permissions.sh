#!/usr/bin/env bash
# Database permission test for invoices, run as the app's anonymous role (publishable key).
# Checks: only paid/paid_date are updatable, consistency rules hold, delete is denied.
# Restores the test invoice to its original state at the end.
set -u
cd "$(dirname "$0")/.."
URL=$(grep '^VITE_SUPABASE_URL=' .env | cut -d= -f2- | tr -d '"')
KEY=$(grep '^VITE_SUPABASE_PUBLISHABLE_KEY=' .env | cut -d= -f2- | tr -d '"')
H=(-H "apikey: $KEY" -H "Content-Type: application/json" -H "Prefer: return=representation")
PASS=0; FAIL=0

# Pick an invoice to test on, remember its original state
ROW=$(curl -s "$URL/rest/v1/invoices?select=id,amount,paid,paid_date&order=invoice_date.desc&limit=1" -H "apikey: $KEY")
ID=$(echo "$ROW" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["id"])')
ORIG=$(echo "$ROW" | python3 -c 'import sys,json;r=json.load(sys.stdin)[0];print(json.dumps({"paid":r["paid"],"paid_date":r["paid_date"]}))')

patch() { curl -s -X PATCH "$URL/rest/v1/invoices?id=eq.$ID" "${H[@]}" -d "$1"; }
expect() { # name, body, expected-substring
  local out; out=$(patch "$2")
  if [[ "$out" == *"$3"* ]]; then echo "PASS  $1"; PASS=$((PASS+1)); else echo "FAIL  $1 -> $out"; FAIL=$((FAIL+1)); fi
}

expect "mark paid with date"                 '{"paid":true,"paid_date":"2026-11-17"}'  '"paid":true'
expect "mark unpaid, date cleared"           '{"paid":false,"paid_date":null}'         '"paid_date":null'
expect "paid without date rejected"          '{"paid":true,"paid_date":null}'          '42501'
expect "unpaid with date rejected"           '{"paid":false,"paid_date":"2026-11-17"}' '42501'
expect "amount change denied"                '{"amount":1}'                            'permission denied'
expect "amount change with paid denied"      '{"amount":1,"paid":false,"paid_date":null}' 'permission denied'
expect "provider_name change denied"         '{"provider_name":"X"}'                   'permission denied'
expect "invoice_date change denied"          '{"invoice_date":"2020-01-01"}'           'permission denied'
expect "due_date change denied"              '{"due_date":"2020-01-01"}'               'permission denied'
expect "apartment_id change denied"          '{"apartment_id":"00000000-0000-0000-0000-000000000000"}' 'permission denied'
OUT=$(curl -s -X DELETE "$URL/rest/v1/invoices?id=eq.$ID" -H "apikey: $KEY")
if [[ "$OUT" == *"permission denied"* ]]; then echo "PASS  delete denied"; PASS=$((PASS+1)); else echo "FAIL  delete -> $OUT"; FAIL=$((FAIL+1)); fi

# amount must be unchanged after all attempts
AFTER=$(curl -s "$URL/rest/v1/invoices?select=amount&id=eq.$ID" -H "apikey: $KEY")
BEFORE_AMT=$(echo "$ROW" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["amount"])')
AFTER_AMT=$(echo "$AFTER" | python3 -c 'import sys,json;print(json.load(sys.stdin)[0]["amount"])')
if [[ "$BEFORE_AMT" == "$AFTER_AMT" ]]; then echo "PASS  amount unchanged ($AFTER_AMT)"; PASS=$((PASS+1)); else echo "FAIL  amount changed $BEFORE_AMT -> $AFTER_AMT"; FAIL=$((FAIL+1)); fi

patch "$ORIG" >/dev/null   # restore
echo "---- $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
