def calculate(value):
    result = 0
    for offset in range(3):
        result += value + offset
    return result


def process(value):
    return calculate(value) + 1


def deep_chain(depth):
    if depth == 0:
        return 0
    return 1 + deep_chain(depth - 1)
