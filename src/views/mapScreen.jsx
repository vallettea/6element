"use strict";

var React = require('react');
var Mui = require('material-ui');
var page = require('page');
var queryString = require('query-string');
var ThemeManager = require('material-ui/lib/styles/theme-manager');
var DefaultRawTheme = Mui.Styles.LightRawTheme;

var Colors = require('material-ui/lib/styles/colors');

var MapView = require('./mapView');
var DetailView = require('./detailView');
var PanelLeft = require('./panelLeft');
var PanelRight = require('./panelRight');
var DialogBox = require('./dialogBox');

var search = require('../js/prepareServerAPI')(require('../js/sendReq')).search;


//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
var injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

module.exports = React.createClass({
    getInitialState: function() {

        // List of networks from endpoint
        var filters = this.props.networks.map(function(network){
            return { name: network.name, color: network.color, checked: true };
        });
        return {
            parameters: {
            what:  this.props.category ?  this.props.categoriesFR.indexOf(this.props.category) : 0, 
            placeName: '', 
            geoloc: this.props.geoloc ? this.props.geoloc : {lat: 44.8404507, lon: -0.5704909}, // Le Node centered
            boundingBox: this.props.boundingBox
        },
            // First empty results to display
            result: { 
                categories: [this.props.categoriesEN[0]], 
                placeName: '',
                objects: [] 
            }, 
            filters: filters, 
            status: this.props.boundingBox ? 3 :
                    this.props.geoloc ? 2 : 1, // INI Status
            listMode: true
        };
        // STATUS Definition
        // -1- Empty map, Zoom 13, no BoundingBox, geoloc centered
        // -2- Filled map, no Zoom, BoudingBox, no centered
        // -3- Filled map, no Zoom, no BoundingBox, no centered
    },
    componentDidMount: function() {
        // For specific urls with geoloc or bounding box, we launch search on start 
        if (this.props.boundingBox)
            this.onSearch(this.state.parameters, this.props.boundingBox, 3, 20);
        if (this.props.geoloc)
            this.onSearch(this.state.parameters, null, 3, 20);
    },
    childContextTypes: {
        muiTheme: React.PropTypes.object
    },
    getChildContext: function() {
        return { muiTheme: ThemeManager.getMuiTheme(DefaultRawTheme) };
    },
    // Display the left list panel
    handleLeftNav: function(e){
        if(e !== undefined) e.preventDefault();
        this.refs.panelLeft.display(!this.state.listMode);
        this.setState({listMode: !this.state.listMode});
    },
    // Display the right networks panel
    handleRightNav: function(e){
        if(e !== undefined) e.preventDefault();
        this.refs.panelRight.toggle();
    },
    // popup the form dialog
    handleSearchNav: function(e){
        if(e !== undefined) e.preventDefault();
        // Temporary hide the left panel
        if(!this.isStarting() && this.state.listMode)
                this.refs.panelLeft.display(false); 

        this.refs.dialogBox.show();
    },
    // Form submit
    submitParameters: function(parameters){
        this.refs.dialogBox.dismiss();
        // Re-Display the Temporary hidden the left panel
        if(!this.isStarting() && this.state.listMode)
                this.refs.panelLeft.display(true);

        this.onSearch(parameters, null, 2, 20);// BOUNDING-BOX = NULL, STATUS = 2
    },
    // Form cancel
    cancelDialog: function(){
        this.refs.dialogBox.dismiss();
        // Re-Display the Temporary hidden the left panel
        if(!this.isStarting() && this.state.listMode)
                this.refs.panelLeft.display(true); 
    },
    // Search request from 2 actions
    // - Form submit
    // - map moves (drag or zoom)
    onSearch: function(parameters, boundingBox, status, nbPlaces){

        var self = this; 
        var data = {
            'placeName': parameters.placeName,
            'categories': [this.props.categoriesEN[parameters.what]],
            'geoloc': parameters.geoloc,
            'boundingBox': boundingBox,
            'nbPlaces': nbPlaces
        };

        search(data)
        .then(function(result){

            // get the qp for the url
            if (boundingBox == null)
                var qp = Object.assign({}, parameters.geoloc);
            else
                var qp = Object.assign({}, boundingBox);
            qp.category = self.props.categoriesFR[parameters.what];
            
           
            // Refresh with new results
            page("?" + queryString.stringify(qp));
            self.setState({
                parameters: parameters,
                result: result, 
                status: status
            });
        })
        .catch(function(error){
            console.log(error);
        });
    },
    // Check on filters (fired by the right networks panel)
    onSelectFilter: function(e){
        var filters = this.state.filters;
        filters.forEach(function(filter){
            filter.checked = false;
        });
        e.forEach(function(row){
            filters[row].checked = true;
        });
        this.setState({filters: filters});
    },
    // Popup the detailed sheet of the clicked point
    onShowDetail: function(object){

        // Temporary hide the left panel
        if(!this.isStarting() && this.state.listMode)
            this.refs.panelLeft.display(object === null); 

        page("/place/" + object.properties.id);
        // this.setState({detailedObject: object});
    },
    // onHideDetail: function(){
    //     // Temporary hide the left panel
    //     if(!this.isStarting() && this.state.listMode)
    //         this.refs.panelLeft.display(true); 

    //     this.setState({detailedObject: undefined});
    // },
    isStarting: function(){
        return this.state.status===1;
    },
    render: function() {

        var ttStyle = {'zIndex': 100};
        var toolBarJSX = 
        <div id="toolbar">
            <Mui.Toolbar>
                <Mui.ToolbarGroup key={0} float="left">
                    <Mui.ToolbarTitle text={<a href="/" className="noRef">6element</a>} />
                </Mui.ToolbarGroup>
                <Mui.ToolbarGroup key={1} float="right">
                    <Mui.IconButton tooltip={this.state.listMode?"Afficher la carte":"Afficher la liste"} tooltipStyles={ttStyle} onTouchTap={this.handleLeftNav}><Mui.FontIcon className="material-icons" color={Colors.pink400} >{this.state.listMode?"map":"storage"}</Mui.FontIcon></Mui.IconButton>
                    <Mui.IconButton tooltip="Rechercher"  tooltipStyles={ttStyle} onTouchTap={this.handleSearchNav}><Mui.FontIcon className="material-icons" color={Colors.pink400} >search</Mui.FontIcon></Mui.IconButton>
                    <Mui.IconButton tooltip="Filtrer par source"  tooltipStyles={ttStyle} onTouchTap={this.handleRightNav}><Mui.FontIcon className="material-icons" color={Colors.pink400} >filter_list</Mui.FontIcon></Mui.IconButton>
                </Mui.ToolbarGroup>
            </Mui.Toolbar>
        </div>
        

        // For serverside rendering (without components activated), 
        // we display a map picture on background
        var isLoaded = (this.props.googleMapsApi !== undefined);
        if(!isLoaded){
            return (
            <div flex layout="row">
                <md-content flex >
                    {toolBarJSX}
                    <div id="backgroundMap" />
                </md-content>
            </div>);
        }
 

        // List of points & Filters
        var result = JSON.parse(JSON.stringify(this.state.result));
        
                        
        return (
            <div flex layout="row">
                <md-content flex >
                    {toolBarJSX}
                    <Mui.Paper>
                        <MapView 
                            leaflet={this.props.leaflet}
                            status={this.state.status} 
                            result={result} 
                            filters={this.state.filters} 
                            parameters={this.state.parameters}
                            onShowDetail={this.onShowDetail} 
                            onSearch={this.onSearch}
                            showHeaderAndFooter={true}
                            hideListIfDisplayed={this.state.listMode?this.handleLeftNav:null} />
                        <PanelLeft 
                            ref="panelLeft"
                            filters={this.state.filters} 
                            onShowDetail={this.onShowDetail} 
                            onSearch={this.onSearch}
                            parameters={this.state.parameters} 
                            result={result}
                            isStarting={this.isStarting} />
                        <PanelRight 
                            ref="panelRight"
                            filters={this.state.filters}
                            onSelectFilter={this.onSelectFilter} />
                        <DialogBox
                            ref="dialogBox"
                            googleMapsApi={this.props.googleMapsApi}
                            isStarting={this.isStarting}
                            categoriesFR={this.props.categoriesFR}
                            parameters={this.state.parameters}
                            submitParameters={this.submitParameters}
                            cancelDialog={this.cancelDialog} />
                    </Mui.Paper>
                </md-content>
            </div>
        );
    }
});