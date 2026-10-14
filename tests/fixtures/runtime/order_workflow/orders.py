class OrderService:
    def __init__(self, inventory, ledger):
        self.inventory = inventory
        self.ledger = ledger

    def submit(self, order):
        subtotal = 0
        for item in order["items"]:
            if not self.inventory.reserve(item["sku"], item["quantity"]):
                return None
            subtotal += item["quantity"] * item["price"]
        return self.ledger.capture(order["id"], subtotal)
