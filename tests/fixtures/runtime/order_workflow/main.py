from inventory import Inventory
from ledger import Ledger
from orders import OrderService
import sys

inventory = Inventory()
ledger = Ledger()
service = OrderService(inventory, ledger)

order_count = int(sys.argv[1]) if len(sys.argv) > 1 else 450
for index in range(order_count):
    order = {
        "id": index,
        "items": [
            {"sku": "basic", "quantity": 1, "price": 5 + index % 5},
            {"sku": "premium", "quantity": 1, "price": 3 + index % 7},
        ],
    }
    charged = service.submit(order)
    if charged is None:
        raise RuntimeError("Unexpected inventory shortage")
    if index % 75 == 0:
        print("checkpoint", index, charged)

print("settled", len(ledger.receipts), ledger.total)
print("inventory", inventory.available["basic"], inventory.available["premium"])
