import {Component} from "react";
import TextField from "../input-field/TextField";
import {col1, col12, col2, col3, col6, container, nameFromVariableName, row} from "../../../MiscUtils";
import "./table.css";

import Paginator from "./Paginator";
import {SUBTITLE} from "../redux/allowed-actions";

/**
 *
 * Creates a table and pre-populates it with data from a given url, or from data passed to it through a property.
 * List of properties:
 *      callback - a callback method or reference that is executed when a row is clicked.
 *      updateTitleContext - a callback method or reference that executed when the component loads and adds
 *                          context-variables information to its host component.
 *
 *      rowsOfData - <Optional> a property consisting of an array of JSON objects representing row-data.
 *
 *      pageSize  - the size of pages in terms of record count. This is passed directly to the paginator which
 *                  wields control over how the table behaves in terms of records display
 *
 */
export default class DynamicTable extends Component {
    constructor(props) {
        // window.alert('assholes')
        super(props); //since we are extending class Table so we have to use super in order to override Component class constructor
        this.removeFloatWindow = props.removeFloatWindow; //this is a method reference to remove the floatWindow component reference. It nullifies the state
        //variable responsible for blocking the workarea
        //other components_to_delete
        this.callback =
            props.callback === undefined
                ? () => {
                    console.warn(
                        `<${this.constructor.name} /> has not been issued with a row-callback property 
                            called 'callback'! this row has nothing to do!`
                    );
                }
                : props.callback;
        //set title context-variables manager
        this.updateTitleContext =
            props.updateTitleContext === undefined
                ? () => {
                    console.warn(`No title manager is set for <${this.constructor.name} />. 
                          Pass a 'titleManager' property when calling this component.`);
                }
                : props.updateTitleContext;

        this.titleContext =
            props.titleContext === undefined ? null : props.titleContext;

        this.state = {
            // state is by default an object
            destructuringColumnNames: null,
            tableColumnNames: [], //column names
            search: [],
            //
            // table consisting of data
            // this data is a array of JSON objects
            // with each object representing a row.
            //
            rowsOfData:
                props.tableData === undefined || props.tableData.length === 0
                    ? []
                    : props.tableData,
            columns: [],
            searchInput: "",
            tableRows: null,
        };
    }

    /**
     *
     * enable refresh of table data as required
     * @param nextProps
     * @param nextContext
     * @constructor
     */
    UNSAFE_componentWillReceiveProps = (nextProps, nextContext) => {
        if (nextProps.tableData) {
            this.setState({rowsOfData: nextProps.tableData}, () => {
                // the rest of the default arguments already set for this method call
                this.createTableRow(this.state.tableData, true);
            });
        }
    }

    /**
     *
     * Fetch data from the server's endpoint as noted in the 'this.withDataFrom' variable.
     *
     */
    componentDidMount = () => {

        this.createTableRow(this.state.rowsOfData, true);
    };

    /**
     *
     * Creates rows of data based on the last argument columnsOfInterest which
     * is an array of columns to view,  and their callbacks;
     * from data fetched from server.
     *
     * That data looks like:
     *  [{columnName: <String>,anotherColumnName:<String>,...},...]
     *   eg, if a licensor wishes to see a report on inspection, they will see a
     *        1. date of inspection
     *        2. operator-registration who was inspected
     *        3. county of inspection
     *        4. premise of inspection
     *        5. who conducted the inspection (an individual or committee name)
     *        6. findings
     *        7. recommendations (might include ceo's recommendations as well)
     * The items above would be represented as follows:
     * [
     *  {
     *    'inspection date': <Date-string>,
     *    'operator-registration': <Operator-name>,
     *    'county': <county name>,
     *    'inspection-team': <inspection-team-name>,
     *    'findings': <findings-list>,
     *    'recommendations': <recommendations-list>,...
     *  },
     *  ...
     * ]
     *
     * @param {*} rowData array of jsons representing the desired data as illustrated in the example above.
     *
     * @param header a boolean telling the method what sort of row it's creating. Header or not header
     *              (the latter being the default) - by default, its set to false.
     *
     * @param callback the method to execute on clicking a given row. The row will implicitly pass the data
     *                  associated with it.
     *
     * @param columnsOfInterest an array of columns whose data should be viewed in the table. Note: the
     *                      original data remains untempered-with. If an empty array (default state) is passed,
     *                      all columns will be shown
     *
     * Note: all methods that implement an argument list with default values can be called with any configuration
     * of arguments. Just make sure that when calling this method with arguments such as:
     *      1. it's not a header but it has a callback (in this case, the scenario of having a row of data inside
     *      the table), make sure that even the argument with default values is called with the default value (if
     *      not up for change)
     *
     * example:
     *      create a row that has a callback but no specific arguments:
     *          NOTES on this - row creates data out of something
     *                        - row is not a header row
     *                        - row has a callback method
     *                        - row has no specific items to give preference when viewing
     *     The method signature/definition looks like this by default
     *          <myDesiredMethodName>(rowData = my_default_source_of_data, header = false, callback = () => {}, columnsOfInterest = [])
     *
     *     With the task as described above, call it as follows:
     *          <myDesiredMethodName>(rowData = <my_source>, false, <my_method_reference>);
     *     Note that with the above call, the last argument is left out. So long as the non-desired argument
     *     is ahead of the intended arguments in the declaration, it can be left out.
     *
     *
     * find a way for limiting the number of pages that are shown
     */
    createTableRow = (
        rowData = this.state.rowsOfData,
        header = false,
        callback = (tableRowData) => {
            console.log("No callback passed to this row. Nothing to do when clicked");
        },
        columnsOfInterest = this.props.columnsOfInterest === undefined ? [] : this.props.columnsOfInterest
    ) => {
        
        // do a check whether rowData is empty in chich case
        if (rowData.length === 0) {
            // window.alert('no data to show')
            // console.log('@DynamicTable, data from server (rowData) does not exist');
            return;
        }
        let rows = [];
        const columnNames = Object.getOwnPropertyNames(rowData[0]);
        // array of json keys which are then used to
        // extract columns from the data returned from the server.
        // Just use the first entry of the array
        if (header) {
            // form the first row of column titles
            let rowsOfDataColumnHeaders = [];
            //iterate through the rows
            //seems repetition but this logic works better than a fancy one at this time...
            for (const name of columnNames)
                if (columnsOfInterest.length === 0)
                    rowsOfDataColumnHeaders.push(<td>{nameFromVariableName(name)}</td>);
                else if (columnsOfInterest.includes(name))
                    rowsOfDataColumnHeaders.push(<td>{nameFromVariableName(name)}</td>);
            //record them in state
            this.setState({tableColumnNames: rowsOfDataColumnHeaders});
        } else {
            //iterate through all rows in the rowsOfData and create rows out of them
            for (const row of rowData) {
                // here, row is an object
                let rowItem = [];
                //iterate through all data items there
                for (const item of Object.getOwnPropertyNames(row)) {
                    //create a row with these items, with table data
                    //seems repetition but this logic works better than a fancy one at this time...
                    // check if value is an integer, or convert it to a string directly...
                    if (columnsOfInterest.length === 0)
                        rowItem.push(<td>{String(row[item]).length > 0 ? row[item] : '--'}</td>);
                    else if (columnsOfInterest.includes(item))
                        rowItem.push(<td>{String(row[item]).length > 0 ? row[item] : '--'}</td>);
                }
                //this row represents the json data of one array
                rows.push(
                    <tr
                        onClick={() => {
                            if (this.props.showRowData)
                                callback(row);
                        }}
                    >
                        {rowItem}
                    </tr>
                );
            }
        }
        // nullify the previous rows and proceed to show the next ones
        if (!header)
            this.setState({tableRows: null}, () => {
                this.setState({tableRows: rows});
            });
        return rows.length > 0 ? rows : null;
    };

    render() {
        //Whenever our class runs, render method will be called automatically, it may have already defined in the constructor behind the scene.
        return (
            <div className={`${container}`} style={{background: "#FFFFFF", width: '100%'}}>
                {
                    this.state.rowsOfData.length > 0 ? <>
                            {/*//this row should float...?*/}
                            {/*<div className={row}>*/}
                            {/*    <div className={col6}/>*/}
                            {/*    <div className={col2}/>*/}
                            {/*    {*/}
                            {/*        this.props.noSearch ? null :*/}
                            {/*            <>*/}

                            {/*                <div className={col3}>*/}
                            {/*                    <TextField*/}
                            {/*                        style={{height: 56}}*/}
                            {/*                        name="search"*/}
                            {/*                        placeholder={""}*/}
                            {/*                        changecallback={() => {*/}
                            {/*                            //*/}
                            {/*                            console.log("search is working");*/}
                            {/*                        }}*/}
                            {/*                    />*/}
                            {/*                </div>*/}
                            {/*                <div className={col1}>*/}
                            {/*                    /!*create a search magnification box here*!/no*/}
                            {/*                </div>*/}

                            {/*            </>*/}
                            {/*    }*/}
                            {/*</div>*/}
                            <div className={row}>
                                <div className={col12}>
                                    <table className={"table"} style={{border: 'none'}}>
                                        <tr className={"table-row-header tr-no-hover"}>
                                            {this.state.tableColumnNames}
                                        </tr>
                                        {/*//create a row that is not a header and has a callback
                                         for each row that's created*/}
                                        {/*// get the current selected table row that's selected*/}
                                        <tbody style={{overflowY: 'scroll'}}>

                                        {/*{this.createTableRow(this.state.rowsOfData, false, (dataToShow) => {*/}
                                        {/*    // console.log("data to show: ", dataToShow);*/}
                                        {/*    // calls the DefaultContainer's floatWindow method, and closecallback equates to*/}
                                        {/*    // removeFloatWindow*/}
                                        {/*})}*/}
                                        {/*// rows created by paginator*/}
                                        {this.state.tableRows}
                                        {/*// do pagination here*/}
                                        </tbody>
                                    </table>
                                </div>
                                <div className={col12}>
                                    <Paginator pageSize={this.props.pageSize ? this.props.pageSize : 8}
                                        // url={'http://172.16.20.4:8081/api/license/'}
                                               recordsList={this.props.tableData} // this is meant to allow pagination
                                               executeOnRowPopulation={(rowsOfData = this.props.tableData) => {
                                                   {
                                                       // console.log('table data ' , rowsOfData)
                                                       this.createTableRow(rowsOfData, false, (dataToShow) => {
                                                           // pass a method that accepts the data in question, showing
                                                           // the table data
                                                           // If using routes, the callback method (showRowData)
                                                           // is a method that navigates to the url in question
                                                           this.props.showRowData(dataToShow);
                                                       })
                                                   }
                                               }}/>
                                </div>
                            </div>
                        </> :
                        <>
                            <div className={'big-space-row'}/>
                            <div className={'big-space-row'}/>
                            <div className={'big-space-row'}/>
                            <div className={row}>
                                <div className={col12} style={{
                                    fontFamily: 'monospace',
                                    fontSize: 32,
                                    fontWeight: 800,
                                    color: '#c5c6d5',
                                    textTransform: 'uppercase'
                                }}>
                                    there is no data to show
                                </div>
                            </div>
                        </>
                }
            </div>
        );
    }

}
