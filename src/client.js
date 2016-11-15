var React = require("react");
var ReactDOM = require("react-dom");
var xhr = require("xhr");

// Create your front-end app here
var main = React.createClass({
  getInitialState: function(){
    return {count: 0};
  },
  dec: function(){
    this.setState({count: this.state.count - 1});
  },
  inc: function(){
    this.setState({count: this.state.count + 1});
  },
  save: function(){
    xhr.post("/save/"+String(this.state.count), function(err, res){
      alert(res.body);
    });
  },
  load: function(){
    xhr.get("/load", (err, res) => {
      this.setState({count: Number(res.body)});
    });
  },
  render: function(){
    return <div>
      <div>Count: {this.state.count}</div>
      <div>
        <button onClick={this.dec}>- 1</button>
        <button onClick={this.inc}>+ 1</button>
        <button onClick={this.save}>Save</button>
        <button onClick={this.load}>Load</button>
      </div>
    </div>;
  }
});

window.onload = function(){
  ReactDOM.render(
    React.createElement(main),
    document.getElementById("main"));
};
