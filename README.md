## Steps for running this contract

1. clone this repo as `git clone https://github.com/rajaroy43/TraceLabsTest.git `
2. cd TraceLabsTest
3. npm install (or yarn from root directory)
2. cp .env.example >> .env (Add rinkeby infura url and private key there )
3. yarn compile (For compiling smart contact)
4. yarn deploy 
    it will deploy Bank Saving contract to rinkeby test network
    Transfering reward pool amount to BankSaving contract
5. yarn test (for running smart contract  test)