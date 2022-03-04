# diy-listing-table
A sort of materialUI table without the materialness. This is a work in progress at this time.
Call it using the component name below, applying the appropriate props listed below:
### The `<DynamicTable />` Component

This component is responsible for showing tables with rows of data Property list:

```
    showRowData - method executed or as a reference used the row is clicked


    tableData - <Optional> a property consisting of an array of JSON objects representing row-data.
    
    noSearch - property whose presence tells the table to hide the search field
    
    
    columnsOfInterest - a array of field names which should be shown. The component creates column
                        names out of the field names in question. If absent or an empty array is used
                        , all columns are shown by default.
                        
    pageSize - the size of pages in terms of record count. This is passed directly to the paginator which
              wields control over how the table behaves in terms of records display

```

**NOTE** 
The table uses the variable names of the data passed in the array of jsons in order to
construct table header names. It is used together with the miscUtils file that provides internal utility
methods. 
