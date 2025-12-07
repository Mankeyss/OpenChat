# OpenChat

<p align="center">
  <img alt="OpenChat" src="https://github.com/user-attachments/assets/346b8037-dcea-4935-96b4-0f1d72b529a1">
</p>

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

### Usage
#### Set up profile with username and optional password
```sh
.setup
```

#### Retrieve a list of available commands
```sh
.help
```

#### Connect to a server
```sh
.connect <url>
```

#### List all available channels in connected server
```sh
.channels
```

#### List all active users in connected server
```sh
.users
```

#### Direct message a specific user
```sh
.dm <user>
```
