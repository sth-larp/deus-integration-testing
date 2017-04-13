# deus-integration-testing

To install
  
    git clone https://github.com/sth-larp/deus-integration-testing.git
    cd deus-integration-testing
    npm install

To start server part

    node server.js

To start client part(s)

    node client.js

To see results (per-client max latency in ms)
http://dev.alice.digital:5984/results-test/_design/character/_view/slowest?limit=15&descending=true

