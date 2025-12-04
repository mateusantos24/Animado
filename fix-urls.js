// fix-urls.js - Script simples para corrigir URLs do GitHub com acentos

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_OWNER = 'mateusantos24';
const REPO_NAME = 'Animado';

console.log('🚀 Iniciando correção de URLs...\n');

// Função para processar cada arquivo JSON
function processJsonFiles() {
  const cachePath = path.join(__dirname, 'Cache', 'Gartic');
  
  if (!fs.existsSync(cachePath)) {
    console.log('⚠️  Pasta Cache/Gartic não encontrada');
    return;
  }

  console.log(`📂 Procurando arquivos em: ${cachePath}\n`);
  
  // Procura recursivamente por arquivos .json
  function findJsonFiles(dir) {
    const files = fs.readdirSync(dir);
    let jsonFiles = [];
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        jsonFiles = jsonFiles.concat(findJsonFiles(fullPath));
      } else if (file.endsWith('.json')) {
        jsonFiles.push(fullPath);
      }
    });
    
    return jsonFiles;
  }
  
  const jsonFiles = findJsonFiles(cachePath);
  
  if (jsonFiles.length === 0) {
    console.log('⚠️  Nenhum arquivo JSON encontrado\n');
    return;
  }

  console.log(`✅ Encontrados ${jsonFiles.length} arquivo(s) JSON\n`);
  
  let fixedCount = 0;

  jsonFiles.forEach(file => {
    console.log(`📝 Processando: ${path.relative(process.cwd(), file)}`);
    
    try {
      // Lê o arquivo
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Regex para encontrar URLs quebradas do GitHub
      // Procura por: https://raw.githubusercontent.com/owner/repo/main/CAMINHO
      const urlPattern = /https:\/\/raw\.githubusercontent\.com\/mateusantos24\/Animado\/main\/([^\s"')]+)/g;
      
      let matchCount = 0;
      
      content = content.replace(urlPattern, (match, filePath) => {
        // Separa o caminho em diretório e arquivo
        const parts = filePath.split('/');
        
        // Codifica apenas o último segmento (nome do arquivo)
        const encodedParts = parts.map((part, index) => {
          // Se for o último elemento (arquivo), codifica
          if (index === parts.length - 1) {
            return encodeURIComponent(part);
          }
          return part;
        });
        
        const newUrl = `https://raw.githubusercontent.com/mateusantos24/Animado/main/${encodedParts.join('/')}`;
        
        if (match !== newUrl) {
          matchCount++;
          console.log(`  ❌ Errada: ${match}`);
          console.log(`  ✅ Corrigida: ${newUrl}`);
        }
        
        return newUrl;
      });
      
      // Se houve mudanças, salva o arquivo
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`  ✅ ${matchCount} URL(s) corrigida(s)\n`);
        fixedCount++;
      } else {
        console.log(`  ℹ️  Nenhuma mudança necessária\n`);
      }
      
    } catch (error) {
      console.error(`  ❌ Erro: ${error.message}\n`);
    }
  });
  
  return fixedCount;
}

// Executa a correção
try {
  const fixed = processJsonFiles();
  
  console.log('════════════════════════════════════════\n');
  
  // Verifica se há mudanças para commit
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    
    if (status) {
      console.log('📊 Mudanças detectadas:\n');
      console.log(status);
      console.log('\n════════════════════════════════════════\n');
      
      console.log('💾 Fazendo commit...\n');
      execSync('git add -A');
      execSync('git commit -m "🔧 Fix: Corrigir URLs raw do GitHub com acentos (URL encoding)"');
      
      console.log('\n✅ Commit realizado com sucesso!\n');
      
      console.log('🚀 Fazendo push para GitHub...\n');
      execSync('git push origin main');
      
      console.log('\n✅ Push realizado com sucesso!\n');
      console.log('🎉 Todos as URLs foram corrigidas e enviadas para o GitHub!');
    } else {
      console.log('ℹ️  Nenhuma mudança detectada para commit');
    }
  } catch (gitError) {
    console.log(`⚠️  Git: ${gitError.message}`);
  }
  
} catch (error) {
  console.error('❌ Erro fatal:', error.message);
  process.exit(1);
}
