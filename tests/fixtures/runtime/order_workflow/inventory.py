class Inventory:
    def __init__(self):
        self.available = {"basic": 900, "premium": 900}
        self.reservations = 0

    def reserve(self, sku, quantity):
        before = self.available[sku]
        if before < quantity:
            return False
        self.available[sku] = before - quantity
        self.reservations += quantity
        return True
