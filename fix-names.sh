#!/bin/bash
cd ~/carolina-crm

# Fix Baborete -> Baborette (with 2 t's)
sed -i 's/Baborete/Baborette/g' src/components/Sidebar.tsx
sed -i 's/Baborete/Baborette/g' src/app/layout.tsx
sed -i 's/Baborete/Baborette/g' src/app/\(dashboard\)/mapa/page.tsx

# Fix Baboretes -> Baborette (remove trailing s)
sed -i 's/Baborettes/Baborette/g' src/lib/email.ts
sed -i 's/Baboretes/Baborette/g' src/lib/email.ts
sed -i 's/Baboretes/Baborette/g' src/app/\(auth\)/esqueci-password/page.tsx
sed -i 's/Baboretes/Baborette/g' src/app/\(auth\)/repor-password/page.tsx
sed -i 's/Baboretes/Baborette/g' src/app/\(auth\)/login/page.tsx

echo "Done fixing names"
