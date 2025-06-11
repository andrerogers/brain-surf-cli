#!/bin/bash

# Brain CLI Setup Script
# This script sets up the Brain CLI tool with all dependencies

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Fancy header
echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                               ║"
echo "║                            🧠 BRAIN SURF CLI                                  ║"
echo "║                                                                               ║"
echo "║                                Surf's up..                                    ║"
echo "║                                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

check_node() {
    echo -e "${BLUE}🔍 Checking Node.js version...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed!${NC}"
        echo -e "${YELLOW}Please install Node.js 18+ from https://nodejs.org${NC}"
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        echo -e "${RED}❌ Node.js version $NODE_VERSION is too old!${NC}"
        echo -e "${YELLOW}Please install Node.js 18+ from https://nodejs.org${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js $NODE_VERSION is compatible${NC}"
}

install_deps() {
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json not found!${NC}"
        echo -e "${YELLOW}Please ensure you have the package.json file in the current directory${NC}"
        exit 1
    fi
    
    # Install dependencies
    npm install
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

setup_env() {
    echo -e "${BLUE}⚙️  Setting up environment...${NC}"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ Created .env file from template${NC}"
            echo -e "${YELLOW}📝 Please edit .env file with your configuration${NC}"
        else
            echo -e "${YELLOW}⚠️  No .env.example found, creating basic .env file${NC}"
            cat > .env << EOF
# Brain CLI Configuration
BRAIN_WS_URL=ws://localhost:3789
BRAIN_WS_TIMEOUT=5000
EOF
            echo -e "${GREEN}✅ Created basic .env file${NC}"
        fi
    else
        echo -e "${GREEN}✅ .env file already exists${NC}"
    fi
}

make_executable() {
    echo -e "${BLUE}🔧 Making CLI executable...${NC}"
    
    if [ -f "bin/brain.js" ]; then
        chmod +x bin/brain.js
        echo -e "${GREEN}✅ Made bin/brain.js executable${NC}"
    else
        echo -e "${RED}❌ bin/brain.js not found!${NC}"
        echo -e "${YELLOW}Please ensure you have the brain.js file in the bin/ directory${NC}"
        exit 1
    fi
}

link_global() {
    echo -e "${BLUE}🔗 Linking CLI globally...${NC}"
    
    if npm link; then
        echo -e "${GREEN}✅ Brain CLI linked globally${NC}"
        echo -e "${GREEN}You can now use 'brain' command from anywhere!${NC}"
    else
        echo -e "${YELLOW}⚠️  Global linking failed (may need sudo)${NC}"
        echo -e "${YELLOW}You can still use: npx brain or ./bin/brain.js${NC}"
    fi
}

test_installation() {
    echo -e "${BLUE}🧪 Testing installation...${NC}"
    
    if command -v brain &> /dev/null; then
        echo -e "${GREEN}✅ Brain CLI is available globally${NC}"
        echo -e "${GREEN}Testing help command...${NC}"
        brain --help
    else
        echo -e "${YELLOW}⚠️  Global command not available, testing local...${NC}"
        if [ -f "bin/brain.js" ]; then
            node bin/brain.js --help
            echo -e "${GREEN}✅ Local CLI working${NC}"
        else
            echo -e "${RED}❌ CLI not working${NC}"
            exit 1
        fi
    fi
}

show_success() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                               ║"
    echo "║                          🎉 SETUP COMPLETE! 🎉                                ║"
    echo "║                                                                               ║"
    echo "║                            Cowabunga Dawg!                                    ║"
    echo "║                                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}Quick Start:${NC}"
    echo -e "${YELLOW}  brain interactive          ${NC}# Start interactive mode"
    echo -e "${YELLOW}  brain connect              ${NC}# Connect to Brain server"
    echo -e "${YELLOW}  brain query \"hello\"        ${NC}# Send a query"
    echo -e "${YELLOW}  brain --help               ${NC}# Show all commands"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo -e "${YELLOW}  1. Edit .env file with your configuration${NC}"
    echo -e "${YELLOW}  2. Start your Brain WebSocket server${NC}"
    echo -e "${YELLOW}  3. Run 'brain interactive' for the best experience${NC}"
    echo ""
    echo -e "${PURPLE}Made with ❤️  for the Brain multi-agent system${NC}"
}

main() {
    echo -e "${BLUE}Starting Brain CLI setup...${NC}"
    echo ""
    
    check_node
    install_deps
    setup_env
    make_executable
    link_global
    test_installation
    
    echo ""
    show_success
}

main "$@"
