from helper import add


def middle(x, y):
    result = add(x, y)
    return result


def outer():
    result = middle(10, 20)
    print(result)
    return result


outer()
