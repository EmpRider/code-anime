from performance_workers import deep_chain, process

total = 0
for index in range(240):
    total += process(index)
    if index % 30 == 0:
        print(f"checkpoint {index}: {total}")

print(f"complete {total}")
print(f"depth {deep_chain(46)}")
