import os
import re

src_dir = '/Users/giovananogueira/Documents/Estaleiro/front-end-serptech/src'
stub_str = '// --- Stub temporário para evitar crashes por mock deletado ---\nconst pessoasMock: any[] = [];\n'

for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()

            if stub_str in content:
                # Remove all existing stubs
                content = content.replace(stub_str, '')

                # We need to find the correct place to insert it.
                # A safe place is after the last import statement.
                # Let's find the last import using a regex that matches `import ... from '...';` or similar
                # Since imports can be multiline, it's easier to find the last occurrence of the string `from "` or `from '`
                
                # split by lines
                lines = content.split('\n')
                last_import_idx = -1
                for i, line in enumerate(lines):
                    if line.startswith('import ') or line.strip().startswith('\} from') or line.strip().startswith('} from'):
                        last_import_idx = i

                if last_import_idx != -1:
                    lines.insert(last_import_idx + 1, '\n' + stub_str.strip())
                else:
                    lines.insert(0, stub_str.strip())
                
                content = '\n'.join(lines)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Fixed formatting in {path.replace(src_dir, '')}")

