import {Component} from "react";
import axios from "axios";

/**
 *
 * Component is responsible for paginating data inside a DynamicTable component
 *
 */
export default class Paginator extends Component {
    constructor(props) {
        super(props);
        this.state = {
            // currentRecordNumber: 0,
            // declare default page size either dynamically through props or statically through state declaration
            pageSize: props.pageSize ? props.pageSize : 5,
            /*
            by default this should be a array, null (load the records list from the list
            of records returned on page load by the dynamic table without resetting the recordsList variable
            */
            recordsList: props.recordsList ? props.recordsList : null,
            // no url to fetch. Use a method to trigger a data fetch to the server
            url: props.url ? props.url : null,
            // the current active component to de-link from the styling queue .paginator-control-box-active
            activeLink: null,
            // these two are updated when data is loaded form the given url
            lastPage: 0,
            maxPages: 0,
            // this should be an array comprising page groups of: array-groups of records

            pages: null
            // class

        }
    }

    /**
     *
     * create groups of arrays of pages
     * @param pageSize the number of records of each group of records
     *
     */
    createPages = async (pageSize = this.state.pageSize) => {
        // create groups based on page-sizes
        let pages = [];
        let pageGroup = [];
        let recordCount = 0;
        let groupCount = 0;
        do {
            // check whether you are at the end of the record count. if so, push the group into pages,
            // then break from this loop
            if (recordCount === this.state.recordsList.length - 1) {
                pageGroup.push(this.state.recordsList[recordCount]); // push the last record when you are in into the page group then push the page group into list of pages
                pages.push(pageGroup);
                break;
            }

            // if count is less than pageSize, page-group it else nullify the group after adding it to the pages directory
            else if (groupCount < pageSize) {
                pageGroup.push(this.state.recordsList[recordCount]);
            } else {
                // push the page group into pages
                pages.push(pageGroup);
                // reset the group
                pageGroup = [];
                // add the new count here
                pageGroup.push(this.state.recordsList[recordCount]);
                groupCount = 0;
            }
            recordCount += 1;
            groupCount += 1;
        } while (recordCount < this.state.recordsList.length);
        // assert the pages and max pages and last page
        this.setState({pages: null, maxPages: 0, lastPage: 0}, () => {
            this.setState({pages: pages, maxPages: pages.length, lastPage: 0});
        });
    }

    //
    // UNSAFE_componentWillReceiveProps = (nextProps, nextContext) => {
    //     if (nextProps.pageSize)
    //         this.setState({pageSize: nextProps.pageSize});
    //     if (nextProps.recordsList)
    //         this.setState({recordsList: null}, () => {
    //             // calculate maximum number of pages
    //             this.setState({recordsList: nextProps.recordsList},
    //                 () => {
    //                     if (this.state.recordsList !== null) {
    //                         const maxPages = Math.round(this.state.recordsList.length / this.state.pageSize);
    //                         this.setState({maxPages: maxPages, lastPage: 0}, () => {
    //                             // re-create the pages again then load the new page
    //                             this.createPages(nextProps.pageSize ? nextProps.pageSize : this.state.pageSize).then(() => {
    //                                 this.props.executeOnRowPopulation(this.state.pages[0]); // load the first page
    //                             });
    //                         });
    //                     }
    //                 });
    //         });
    //     if (nextProps.url)
    //         this.setState({url: null}, () => {
    //             this.setState({url: nextProps.url});
    //         });
    // }
    /**
     *
     * fetch data if there is a url that's supplied else show the recordsList declared else show no data toshow
     *
     */
    componentDidMount = () => {
        if (this.props.url === undefined && this.props.recordsList === undefined) return;
        // check whether there is a url that is mentioned in the url state variable to fetch data. If there is,
        // fetch data from that url else go through the recordsList variable and call a method to draw the
        // data on the DynamicTable component through it
        if (this.state.url !== null) {
            axios.get(this.state.url, {
                withCredentials: true,
                headers: {"Content-Type": "*/*"}
                , //accept plain text as well just because.
            }).then(response => {
                // host the data into the recordsList state variable
                this.setState({recordsList: response.data}, () => {
                    // create pages
                    this.createPages().then(() => {
                        this.props.executeOnRowPopulation(this.state.pages[0]); // load the first page
                    });
                    // show page 1 with the records desired
                    //initially show the list of records as prescribed in next
                });
            });
        } else {
            // do a page creation
            this.createPages().then(() => {
                this.props.executeOnRowPopulation(this.state.pages[0]); // load the first page
            });
        }
        // calculate
    }


    /**
     *
     * load next page
     *
     */

    next = () => {
        if (this.state.currentRecordNumber === this.state.recordsList.length || this.state.lastPage === this.state.maxPages)
            // if the previous page is the last page, hint that this is the last page
            return;

        else {
            // navigate to the next page: lastPage += 1
            this.setState({lastPage: this.state.lastPage + 1}, () => {
                this.props.executeOnRowPopulation(this.state.pages[this.state.lastPage]);
            });
        }
    }
    /**
     * load previous page
     */
    previous = () => {
        if (this.state.lastPage < 0) {
            // hint this is the first page
            // remove the next button

        } else {
            this.setState({lastPage: this.state.lastPage - 1}, () => {
                this.props.executeOnRowPopulation(this.state.pages[this.state.lastPage])
            });
        }
    }
    /**
     *
     * load a given page number from selection of pages labelled in the divs
     * @param pageNumber
     *
     */
    page = (pageNumber = 1) => {
        this.setState({lastPage: pageNumber - 1}, () => {
            this.props.executeOnRowPopulation(this.state.pages[this.state.lastPage])
        });
    }
    /**
     *
     * sets active or inactive based on arguments passed
     * @param e the element in question
     * @param removeActive whether to remvoe active class and not update the current element in state
     */
    setActive = (e, removeActive = false) => {
        const activeClassName = 'paginator-control-box-active';
        // look for the previous component in state
        // set previous item in tate to remove that class
        if (this.state.currentLink) {
            this.setState(state => {
                state.currentLink.target.classList.remove(activeClassName)
                return state;
            }, () => {
                // remove the currentLink component
                this.setState({currentLink: null}, () => {
                    if (!removeActive) {
                        // set the element e as the current active item
                        e.target.classList.add(activeClassName);
                        // set state currentLink with the current item
                        this.setState({currentLink: e});
                    }
                });
            });
        } else if (!removeActive) {
            // set the element e as the current active item
            e.target.classList.add(activeClassName);
            // set state currentLink with the current item
            this.setState({currentLink: e});
        }
    }
    /**
     *
     * Draws a box necessary for clicking events in order to view what to do when a user clicks it
     * @param value
     * @returns {JSX.Element}
     */
    box = (value) => {
        return <div className={'paginator-control-box'}
                    style={{borderLeft: value === '<' || value === 1 ? '1px solid #d3d3d8' : null}}
                    onClick={(e) => {
                        // if value is not a string, do not call page nor set active
                        if (value.constructor.name !== 'String') {
                            this.page(parseInt(value));
                            // set this page to active, set previous box to inactive
                            this.setActive(e);
                        } else {
                            if (value === '>')
                                this.next();
                            else if (value === '<')
                                this.previous();
                        }
                    }}>
            {value}
        </div>
    }
    /**
     *
     * Draw the number of boxes required to show the pages there are
     * @returns {JSX.Element}
     */
    render = () => {
        if (this.props.url === undefined && this.props.recordsList === undefined) return null;
        if (this.state.recordsList === null || this.state.recordsList.length === 0) {
            return null;
        } else {
            let boxes = [];
            let numberOfPages = Math.round(this.state.recordsList.length / this.state.pageSize);
            let k = 0
            do {
                boxes.push(this.box(k + 1));
                k += 1;
            } while (k < numberOfPages);
            //
            return <div className={'paginator-control-bar'}>
                {this.state.lastPage === 0 ? null : this.box('<')}
                {boxes}
                {this.state.lastPage === this.state.maxPages - 1 ? null : this.box('>')}
            </div>;
        }
    }
}