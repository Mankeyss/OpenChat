# OpenChat

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/mankeyss/openchat.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Copy `.env.example` in `src/server` 
   ```sh
   cd src/server
   cp -a .env.example .env
   ```
4. Replace `PRIVATE_KEY` with your own private RSA key
   ```env
   PRIVATE_KEY="your key"
   ```
5. Make OpenChat available through the command prompt
   ```sh
   cd ../client
   npm run build
   npm link
   ```
   Now try running ```oc``` and it should work
