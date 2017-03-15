module.exports = {
  init: {
    companies: {},
    users: {},
    logs: []
  },

  next: tx => state => {
    // Processes pending sends
    const processPendings = state => {
      for (let companyName in state.companies) {
        const company = state.companies[companyName];
        while (state.logs[company.pendings[0]]) {
          const tx = state.logs[company.pendings[0]];
          if (tx.value <= company.balance) {
            company.pendings.shift();
            state.users[tx.to[0]].balances[tx.to[1]] += tx.value;
            state.companies[tx.to[1]].balance += tx.value;
            tx.status = "confirmed";
          } else break;
        };
      };
    };

    // App transaction logic
    switch (tx.type) {
      case "new_user":
      state.users[tx.name] = {
        name: tx.name,
        balances: {},
        email: tx.email || "no@email.com",
      }
      for (let companyName in state.companies)
        state.users[tx.name].balances[companyName] = 0;
      break;

      case "new_company":
      state.companies[tx.name] = {
        name: tx.name,
        balance: 0,
        pendings: []
      }
      for (let userName in state.users)
        state.users[userName].balances[tx.name] = 0;
      break;

      case "fund_company":
      state.companies[tx.name].balance += tx.value;
      break;

      case "fund_user":
      if (!state.users[tx.name].balances[tx.company])
        state.users[tx.name].balances[tx.company] = 0;
      state.users[tx.name].balances[tx.company] += tx.value;
      state.logs.push({type: "fund", to: [tx.name, tx.company], value: tx.value});
      break;

      case "send":
      if (state.users[tx.from[0]].balances[tx.from[1]] >= tx.value) {
        state.companies[tx.from[1]].pendings.push(state.logs.length);
        state.logs.push({
          type: "send",
          status: "pending",
          from: tx.from,
          to: tx.to,
          value: tx.value
        });
        state.users[tx.from[0]].balances[tx.from[1]] -= tx.value;
        state.companies[tx.from[1]].balance -= tx.value;
      }
      break;

      case "clear":
      for (let i = 0, l = state.logs.length; i < l; ++i) {
        const tx = state.logs[i];
        if (tx.status === "pending") {
          tx.status = "cancelled";
          state.users[tx.from[0]].balances[tx.from[1]] += tx.value;
          state.companies[tx.from[1]].balance += tx.value;
          state.logs.push({type: "fund", to: tx.from, value: tx.value});
        }
      };
      break;
    };
    processPendings(state);
    return state;
  }

};

