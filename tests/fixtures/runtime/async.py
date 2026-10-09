import asyncio


async def worker(name, state):
    before = state['value']
    await asyncio.sleep(0)
    state['value'] += 1
    print(name, state['value'])


async def main():
    state = {'value': 0}
    await asyncio.gather(worker('A', state), worker('B', state))


asyncio.run(main())
