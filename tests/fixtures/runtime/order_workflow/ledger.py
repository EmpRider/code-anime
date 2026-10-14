class Ledger:
    def __init__(self):
        self.receipts = []
        self.total = 0

    def capture(self, order_id, subtotal):
        amount = subtotal + subtotal // 10
        receipt = {"order": order_id, "amount": amount}
        self.receipts.append(receipt)
        self.total += amount
        return amount
