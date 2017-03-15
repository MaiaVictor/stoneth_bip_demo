const React = require("react");
const ReactDOM = require("react-dom");
const ssm = require("./../../../../shared-state-machine");
const app = require("./bipApp.js");
const Q = require("bluebird");

const formatBrl = amount => "R$" + amount.toFixed(2);
const formatLoc = loc => loc[0] + " ("+loc[1]+")";

const Selector = React.createClass({
  select: function(e) {
    this.props.onSelect(e.target.value);
  },
  render: function() {
    return <select onChange={this.select}>
      {this.props.options.map((option, i) => 
        <option key={i} value={option}>
          {option}
        </option>)}
    </select>;
  }
});

const Input = React.createClass({
  change: function(e) {
    this.props.onChange(e.target.value);
  },
  render: function() {
    return <input type="text" onChange={this.change}/>;
  }
});

const UserWidget = React.createClass({
  getInitialState: function() {
    return {
      tab: "extrato",
      companyName: Object.keys(this.props.app.companies)[0],
      sendCompanyName: Object.keys(this.props.app.companies)[0],
      sendUserName: Object.keys(this.props.app.users)[0],
      sendValue: 0,
    };
  },
  selectCompany: function(companyName) {
    this.setState({companyName: companyName});
  },
  selectSendCompany: function(companyName) {
    this.setState({sendCompanyName: companyName});
  },
  selectSendUser: function(userName) {
    this.setState({sendUserName: userName});
  },
  selectSendValue: function(value) {
    this.setState({sendValue: Number(value)});
  },
  selectTab: function(tab) {
    return () => this.setState({tab: tab});
  },
  send: function() {
    this.props.act({
      type: "send",
      from: [this.props.userName, this.state.companyName],
      to: [this.state.sendUserName, this.state.sendCompanyName],
      value: this.state.sendValue
    });
  },
  render: function() {
    return <div className="bipUser">
      <div className="bipUserTop">
        <div className="bipUserTopLeft">
          {this.props.userName}
          {" "}
          <Selector options={Object.keys(this.props.app.companies)} onSelect={this.selectCompany}/>
        </div>
        <div className="bipUserTopRight">
          <div className="bipUserTabs">
            <div className="bipUserTab" onClick={this.selectTab("extrato")}>
              {this.state.tab === "extrato" ? <strong>Extrato</strong> : <span>Extrato</span>}
            </div>
            <div className="bipUserTab" onClick={this.selectTab("enviar")}>
              {this.state.tab === "enviar" ? <strong>Enviar</strong> : <span>Enviar</span>}
            </div>
          </div>
        </div>
      </div>
      <div>{this.state.tab === "extrato" ? this.renderLogs() : this.renderSend()}</div>
      {!this.props.app ? null : <p className="bipUserBalance">
        <strong>Saldo: </strong>
        {formatBrl(this.props.app.users[this.props.userName].balances[this.state.companyName])}
      </p>}
    </div>;
  },
  renderSend: function() {
    return <div className="bipUserSend">
      <table>
        <tbody>
          <tr>
            <td>Destino:</td>
            <td>
              <Selector options={Object.keys(this.props.app.users)} onSelect={this.selectSendUser}/>
              <Selector options={Object.keys(this.props.app.companies)} onSelect={this.selectSendCompany}/>
            </td>
          </tr>
          <tr>
            <td>Valor (R$):</td>
            <td>
              <Input onChange={this.selectSendValue}/>
            </td>
          </tr>
          <tr>
            <td>Enviar:</td>
            <td>
              <button className="bipUserSendButton" onClick={this.send}>
                Enviar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>;
  },
  renderLogs: function() {
    const isRelevant = tx => 
      tx.from && (tx.from[0] === this.props.userName && tx.from[1] === this.state.companyName) || 
      tx.to   && (tx.to  [0] === this.props.userName && tx.to  [1] === this.state.companyName);
    return <div className="bipUserTransactions">
      <table className="bipUserTransactionsTable">
        <thead className="bipUserTransactionsTableHead">
          <tr>
            <td>Tipo</td>
            <td>Valor</td>
            <td>Dest.</td>
          </tr>
        </thead>
        <tbody>{
          this.props.app.logs.filter(isRelevant).map((tx, i) => {
            switch (tx.type) {
              case "fund": return <tr key={i}  className="bipUserTransactionGreen">
                <td>Crédito</td>
                <td>{formatBrl(tx.value)}</td>
                <td>-</td>
              </tr>;
              case "send": 
                return tx.from[0] !== this.props.userName
                  ? <tr key={i} className={"bipUserTransaction" + (tx.status !== "confirmed" ? "Yellow" : "Green")}>
                    <td>Recebimento</td>
                    <td>{formatBrl(tx.value)}</td>
                    <td>{formatLoc(tx.from)}</td>
                  </tr>
                  : <tr key={i} className={"bipUserTransaction" + (tx.status !== "confirmed" ? "Yellow" : "Red")}>
                    <td>Pagamento</td>
                    <td>{formatBrl(tx.value)}</td>
                    <td>{formatLoc(tx.to)}</td>
                  </tr>;
            }})
        }</tbody>
      </table>
    </div>;
  }
});

const CompaniesWidget = React.createClass({
  render: function() {
    const isRelevantTo = companyName => tx => tx.type === "send"
      && (tx.from[1] === companyName || tx.to[1] === companyName);

    const volume = companyName => this.props.app.logs
      .filter(isRelevantTo(companyName))
      .map(tx => tx.value)
      .reduce((a, b) => a + b, 0);
          
    return <div className="bipUser">
      <table className="bipCompaniesTable">
        <thead className="bipCompaniesTableHead">
          <tr>
            <td>Empresa</td>
              <td>Saldo</td>
            <td>Volume</td>
          </tr>
        </thead>
        <tbody>{Object.keys(this.props.app.companies).map((companyName, i) =>
          <tr key={i}>
            <td>{companyName}</td>
            <td>{formatBrl(this.props.app.companies[companyName].balance)}</td>
            <td>{formatBrl(volume(companyName))}</td>
          </tr>)
        }</tbody>
      </table>
    </div>;
  }
});

const AdminWidget = React.createClass({
  getInitialState: function() {
    return {
      fundCompanyName: Object.keys(this.props.app.companies)[0],
      fundCompanyValue: 0,
      fundUserName: Object.keys(this.props.app.users)[0],
      fundUserCompanyName: Object.keys(this.props.app.companies)[0],
      fundUserValue: 0
    }
  },
  setField: function(field, map) {
    return value => this.setState({[field]: map(value)});
  },
  fundCompany: function() {
    this.props.act({
      type: "fund_company",
      name: this.state.fundCompanyName,
      value: this.state.fundCompanyValue
    });
  },
  fundUser: function() {
    this.props.act({
      type: "fund_user",
      name: this.state.fundUserName,
      company: this.state.fundUserCompanyName,
      value: this.state.fundUserValue
    });
  },
  clear: function() {
    this.props.act({
      type: "clear"
    });
  },
  render: function() {
    return <div className="bipUser">
      <table>
        <tbody>
          <tr>
            <td colSpan={2}><strong>Adicionar fundos a empresa</strong></td>
          </tr>
          <tr>
            <td>Empresa</td>
            <td><Selector options={Object.keys(this.props.app.companies)} onSelect={this.setField("fundCompanyName", x=>x)}/></td>
          </tr>
          <tr>
            <td>Valor</td>
            <td><Input onChange={this.setField("fundCompanyValue", Number)}/></td>
          </tr>
          <tr>
            <td>Adicionar</td>
            <td><button onClick={this.fundCompany}>Adicionar</button></td>
          </tr>
          <tr>
            <td colSpan={2}><strong>Adicionar fundos a conta</strong></td>
          </tr>
          <tr>
            <td>Conta</td>
            <td>
              <Selector options={Object.keys(this.props.app.users)} onSelect={this.setField("fundUserName", x=>x)}/>
              <Selector options={Object.keys(this.props.app.companies)} onSelect={this.setField("fundUserCompanyName", x=>x)}/>
            </td>
          </tr>
          <tr>
            <td>Valor</td>
            <td><Input onChange={this.setField("fundUserValue", Number)}/></td>
          </tr>
          <tr>
            <td>Adicionar</td>
            <td><button onClick={this.fundUser}>Adicionar</button></td>
          </tr>
          <tr>
            <td colSpan={2}><strong>Fim do dia</strong></td>
          </tr>
          <tr>
            <td>Fechar dia:</td>
            <td><button onClick={this.clear}>Clear</button></td>
          </tr>
        </tbody>
      </table>
    </div>;
  }
});

const main = React.createClass({
  getInitialState: function(){
    return {app: null};
  },
  componentDidMount: function(){ 
    this.ssm = null;
    ssm.play(app, "http://localhost:7171").then(ssm => {
      this.ssm = ssm;
      ssm.get(state => this.setState({app: state}));
    });
  },
  render: function(){
    return <div>
      {!this.state.app ? null : <div>
        <CompaniesWidget app={this.state.app}/>
        <UserWidget userName="Victor" app={this.state.app} act={this.ssm.act}/>
        <UserWidget userName="Fernanda" app={this.state.app} act={this.ssm.act}/>
        <AdminWidget app={this.state.app} act={this.ssm.act}/>
      </div>}
    </div>
  }
});

window.onload = function(){
  ReactDOM.render(
    React.createElement(main),
    document.getElementById("main"));
};





/*
_________________________
|FERNANDA        [PAYPAL]|
|========================|
|__EXTRATO___|___enviar__|
|(transações)            |
|------------------------|
| SALDO                  |
|------------------------|

_________________________
|FERNANDA        [PAYPAL]|
|========================|
|__extrato___|___ENVIAR__|
| VALOR: [__________]    |
| EMAIL: [__________]    |
| EMPRE: [__________]    |
| [ENVIAR]               |
|------------------------|
*/
