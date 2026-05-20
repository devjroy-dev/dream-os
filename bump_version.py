with open('package.json', 'r') as f:
    content = f.read()

content = content.replace('"version": "0.10.0-alpha"', '"version": "0.10.2-alpha"', 1)

with open('package.json', 'w') as f:
    f.write(content)

print('Bumped: package.json -> 0.10.2-alpha')
