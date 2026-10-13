from performance_workers import deep_chain, process

total = 0
for index in range(480):
    total += process(index)
    # A representative nested local value and frequent real console output
    # exercise inspector serialization and paginated replay together.
    snapshot = {
        "index": index,
        "batch": index // 24,
        "running_total": total,
        "window": list(range(index, index + 16)),
    }
    print(f"item {index}: {total}")

print(f"complete {total}")
print(f"depth {deep_chain(46)}")
