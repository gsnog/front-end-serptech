import os
import re

src_dir = '/Users/giovananogueira/Documents/Estaleiro/front-end-serptech/src'
for root, _, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'pessoasMock' in content:
                original = content
                # Handle import { ..., pessoasMock, ... }
                content = re.sub(
                    r'import\s+\{([^}]*)pessoasMock([^}]*)\}\s+from\s+["\']@/services/pessoas["\'];?',
                    lambda m: f'import {{{m.group(1)}{m.group(2)}}} from "@/services/pessoas";'.replace(', ,', ',').replace(',,', ',').replace('{,', '{').replace(',}', '}').replace('import {} from "@/services/pessoas";', '').replace('import { } from "@/services/pessoas";', '').replace('import {  } from "@/services/pessoas";', ''),
                    content
                )
                
                # Handle direct import { pessoasMock }
                content = re.sub(r'import\s+\{\s*pessoasMock\s*\}\s+from\s+["\']@/services/pessoas["\'];?', '', content)
                
                # Check if we need to add a stub
                if 'pessoasMock' in content and 'const pessoasMock' not in content:
                    # Insert after the last import or at the top
                    lines = content.split('\n')
                    last_import = -1
                    for i, line in enumerate(lines):
                        if line.startswith('import '):
                            last_import = i
                    
                    stub = '\n// --- Stub temporário para evitar crashes por mock deletado ---\nconst pessoasMock: any[] = [];\n'
                    if last_import != -1:
                        lines.insert(last_import + 1, stub)
                    else:
                        lines.insert(0, stub)
                    content = '\n'.join(lines)
                
                if content != original:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed {path.replace(src_dir, '')}")

