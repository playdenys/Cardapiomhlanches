# 🍔 Delivery Digital Profissional

Seu sistema de delivery de baixo custo com experiência premium, controlado por você via painel admin.

## ✨ Recursos

- **Experiência Mobile-First** - Interface otimizada para celulares como app nativo
- **Painel Admin Completo** - Controle total: produtos, preços, taxa de entrega, pedido mínimo
- **Carrinho Inteligente** - Cálculo automático de subtotal e total
- **Integração WhatsApp** - Pedidos enviados automaticamente com mensagem formatada
- **Persistência Local** - Seus dados ficam salvos no navegador
- **100% Grátis** - Sem mensalidade, sem servidor, sem复杂

## 🚀 Como Publicar no GitHub Pages

### Passo 1: Criar repositório no GitHub
1. Acesse [github.com/new](https://github.com/new)
2. Nome do repositório: `delivery-digital` (ou outro nome)
3. Marque **Public**
4. Clique em "Create repository"

### Passo 2: Enviar arquivos
No terminal, na pasta do projeto:

```bash
# Inicializar git (se ainda não fez)
git init
git add .
git commit -m "Primeiro commit - Delivery Digital"

# Adicionar remoto (substitua SEU-USUARIO pelo seu usuário GitHub)
git remote add origin https://github.com/SEU-USUARIO/delivery-digital.git

# Enviar para o GitHub
git push -u origin main
```

### Passo 3: Ativar GitHub Pages
1. Vá no repositório → **Settings** → **Pages**
2. Em "Build and deployment":
   - **Source**: Deploy from a branch
   - **Branch**: main
   - **Folder**: /(root)
3. Clique **Save**
4. Aguarde 1-2 minutos

### Passo 4: Acessar seu delivery
- O link será algo como: `https://SEU-USUARIO.github.io/delivery-digital/`
- Configure no painel admin (PIN: 1234)

## 📱 Como Usar

### Cliente
1. Acesse o link do seu delivery
2. Browse pelos produtos
3. Adicione ao carrinho
4. Preencha nome, endereço e forma de pagamento
5. Clique em "Finalizar Pedido" - abre WhatsApp com mensagem pronta

### Administrador
1. Clique em "Admin" no rodapé
2. Digite o PIN (padrão: 1234)
3. Configure:
   - Nome da marca
   - Número do WhatsApp (apenas números, ex: 5511999999999)
   - Taxa de entrega
   - Valor mínimo do pedido
   - Seu PIN personalizado
4. Gerencie produtos (adicionar, editar, excluir)

## 🔧 Configurações do Painel Admin

| Campo | Descrição |
|-------|-----------|
| Nome da Marca | Nome que aparece no header |
| Slogan | Texto abaixo do nome |
| WhatsApp | Número com código do país (55 Brasil) |
| Taxa de Entrega | Valor fixo adicionado ao pedido |
| Pedido Mínimo | Valor mínimo para delivery |
| PIN Admin | Senha de 4 dígitos para acessar admin |

## 💡 Dicas

- **Personalize**: Adicione seus produtos, preços e imagens
- **Compartilhe**: Envie o link para seus clientes
- **Atualize**: Altere o cardápio quando precisar
- **Monitore**: Veja os pedidos no histórico do admin

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

Feito com ❤️ para empreendimentos delivery de baixo custo