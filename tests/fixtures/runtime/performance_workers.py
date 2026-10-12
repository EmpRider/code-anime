def calculate(value):
    result = 0
    for offset in range(3):
        result += value + offset
    return result


def process(value):
    return calculate(value) + 1
