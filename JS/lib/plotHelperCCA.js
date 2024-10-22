'use strict';

/////////////////////////////////////////////////////////
//                  Import Data                       //
/////////////////////////////////////////////////////////
// function importPETData(fileName){
    
//     let PET_data = {'Power':[], 'Time':[], 'Energy':[]};
//     let dataLoadPromise = d3.csv(fileName, rowData => {
        
//         let rowKeys = Object.keys(rowData);
        
//         rowKeys.forEach( e => {
//             if(e.toLowerCase().includes("energy"))
//                 PET_data.Energy.push( Number(rowData[e]) )
//            else if(e.toLowerCase().includes("power"))
//                 PET_data.Power.push( Number(rowData[e]) )
            
//             else if(e.toLowerCase().includes("time")){  // Checking type of time
//                 if (new Date(rowData[e]) instanceof Date && !isNaN(new Date(rowData[e]).valueOf()))
//                     PET_data.Time.push( new Date(rowData[e]) )
                
//                 else if(!isNaN( Number(rowData[e]) ) )
//                     PET_data.Time.push( Number(rowData[e]) )
                
//                 else  
//                      PET_data.Time.push( rowData[e] )
//             }
//             else
//                 alert("CSV import failed - headers should contain 'time' or either: i) 'power'  ii) 'energy' ")
//         })
//     }).then( (_) => {return PET_data});
    
//     return dataLoadPromise;
// }


async function readCSV_TPE(fileObj){
    let fileText = await fileObj.text();
    
    return new Promise( (resolve,reject) => {
        let PET_data = {'Power':[], 'Time':[], 'Energy':[]};
        let eachRow = fileText.split('\r\n');
        let HeaderText = eachRow[0].split(',');
        
        for( let j = 1; j < eachRow.length; j++){
            let rowTxt = eachRow[j].split(',')
            
            HeaderText.forEach( (head,index) => {                
                if( head.toLowerCase().includes("power"))
                    PET_data['Power'].push( Number(rowTxt[index]) )
                
                if( head.toLowerCase().includes("energy"))
                    PET_data['Energy'].push( Number(rowTxt[index]) )
                
                if( head.toLowerCase().includes("time")){  // Checking type of time
                        let rowDate = new Date(rowTxt[index])
                        if (rowDate instanceof Date && !isNaN(rowDate).valueOf() )
                            PET_data.Time.push( new Date(rowTxt[index]) )
                        
                        else if(!isNaN( Number(rowTxt[index]) ) )
                            PET_data.Time.push( Number(rowTxt[index]) )
                        
                        else  
                             PET_data.Time.push( rowTxt[index] )
                    }
            } ) 
        }
        resolve(PET_data)
    })
    
}

function loadSelectedData(fileInputTag, dtInput){
    
    
    let inFile = fileInputTag.files[0]
    //let dataLoadPromise = importPETData(inFile) 
    let dataLoadPromise = readCSV_TPE(inFile)  

    //handles fractions, decimal
    let dtVal = dtInput.value
    if  (dtVal) //user inpust dt
         dtVal = dtVal.split('/').reduce((n, d, i) => n / (i ? d : 1));
    else //Default to 1 a
        dtVal = 1 
    
    dataLoadPromise.then( dataET => {
        if(dataET.Energy.length >0 ) // we have energy data 
            updatePlot(dataET.Time, dataET.Energy, true, dtVal)
        else // we have power data
            updatePlot(dataET.Time, dataET.Power, false, dtVal)
      });
      
}


async function loadSampleData(){
    
    let fileName = "JS\\SampleData.csv"
    
    //let dataLoadPromise = importPETData(fileName) 
    let importFobj = await fetch(fileName, {
            method: 'get',
            headers: {'content-type': 'text/csv;charset=UTF-8',}
        });
    
    //let dataLoadPromise = importPETData() 
    let dataLoadPromise = readCSV_TPE(importFobj) 
    
  dataLoadPromise.then( dataET => {
    dataET.Time.unshift(dataET.Time[0]) // extra 0 since sample data does not have this for peak/trough analysis
    dataET.Energy.unshift(0)
    
      
    updatePlot(dataET.Time, dataET.Energy, true, 0.5)
  });
  
}

/////////////////////////////////////////////////////////
//                  Create table                       //
/////////////////////////////////////////////////////////

//deletes the existing table content and create a new table
function createTable(tabDiv, rowHeader, headStyle, rowcolData, cellStyle ){ //rowHeader Nx1 Array [1,2..., N],  col data NxM array [ [1,...N], ..., [1,...N] ]
    
    clearTable(tabDiv);
    
    if (typeof rowcolData !== undefined){
        if(rowHeader.length != rowcolData[0].length)
            throw "Row length does not match col length"
    }
    
    createTablehead(tabDiv, rowHeader, headStyle)
    
    rowcolData.forEach( rowData => {
        appendTable(tabDiv, rowData, cellStyle) 
    })
}

function clearTable(tabDiv){
       if(typeof tabDiv !== undefined){
        tabDiv.innerHTML = '';
    } 
}

function createTablehead( tabDiv, hdrTxt, hdrStyle){
    let hdRow = tabDiv.insertRow(-1);
    
    hdrTxt.forEach( hdtxt => {
        let tabTH = document.createElement("TH");
        
        tabTH.innerHTML = hdtxt;
        tabTH.classList.add(hdrStyle);
        
        hdRow.appendChild(tabTH);
    })
}

function appendTable(tabDiv, rowData, cellStyle){
    let newRow = tableDataDisplay.insertRow(-1);
    rowData.forEach( (cellCont, colIndex) => {
        let newcell = newRow.insertCell(colIndex);
        newcell.classList.add(cellStyle);
        
        let cellContent;
        
        if(typeof cellCont === 'string' || typeof cellCont === 'number' )
            cellContent = document.createTextNode(cellCont);
        else if(cellCont instanceof HTMLElement)
            cellContent = cellCont;
        
        newcell.appendChild(cellContent);
    })
}

/////////////////////////////////////////////////////////
//                  Create CC table                    //
/////////////////////////////////////////////////////////

function fillCCTable(CCA_results,T, P, E){
    
    let tableDataDisplay = document.getElementById('tableDataDisplay');
    
    let currentActiveCC = null;
    
    // Limit number input box to only select the max CC
    let ccScroll = document.getElementById('CC_Selector');
    ccScroll.max = CCA_results.CritCap.Load.length ;
    ccScroll.disabled = false;

    //listen to the table for button presses
    tableDataDisplay.addEventListener('click',(event)=>{
          const isButton = (event.target.nodeName === 'BUTTON');  
            if (!isButton){return;}
            currentActiveCC = changeButtonColor(event.target, currentActiveCC)
            selectActiveCC( CCA_results, Number(currentActiveCC.textContent), T, P, E )
            ccScroll.value = currentActiveCC.textContent
        });

    //listen for scroll wheel
    ccScroll.addEventListener('change', (event) => {
        let ccNum = event.target.value;
        currentActiveCC = changeButtonColor( document.getElementById('tableDataDisplay').rows[ ccNum].querySelector('Button'), currentActiveCC );
        selectActiveCC(CCA_results, Number(currentActiveCC.textContent), T, P, E)
        });
        
    let CC = CCA_results.CritCap.Load;
        
        
    clearTable(tableDataDisplay);
    createTablehead(document.getElementById('tableDataDisplay'), ['CC index','CC Magnitude', 'GSE @ CC','T Start (gen)','CC Ts','CC Te','Inner CC'], 'tblHead');
    // Calc the GSE and push the values into the table
    for(let j = 0; j < CC.length; j++){
            
        //first col, button formatting
        let But_ccSelc  = document.createElement('Button');
        But_ccSelc.style.height = '20px';
        But_ccSelc.style.width  = '30px';
        But_ccSelc.textContent = (j+1).toString();
        
        let rowdata =  [
                But_ccSelc,                    //CC select button
                CC[j].toFixed(1),              //magnitude
                CCA_results.GSE[j].toFixed(1)  //GSE
                ]
        if (T[CCA_results.LTStart[j]] instanceof Date && !isNaN(T[CCA_results.LTStart[j]].valueOf())){
            rowdata.push(formatDateString( T[CCA_results.LTStart[j]] ))     //StartT w/ gen
            rowdata.push(formatDateString( T[CCA_results.CCTS.Load[j][0] ] ))//StartT
            rowdata.push(formatDateString( T[CCA_results.CCTS.Load[j][1] ] ))//EndT
        
        } else{
            rowdata.push( T[CCA_results.LTStart[j]] )     //StartT w/ gen
            rowdata.push( T[CCA_results.CCTS.Load[j][0] ] )//StartT
            rowdata.push( T[CCA_results.CCTS.Load[j][1] ] )//EndT
        
        }
        rowdata.push('Not Impl') //innerCC
        appendTable(tableDataDisplay, rowdata,'tabCell')
    }
    //Initially select the first CC
    currentActiveCC = changeButtonColor( document.getElementById('tableDataDisplay').rows[1].querySelector('Button'), null );
    selectActiveCC(CCA_results, Number(currentActiveCC.textContent), T, P, E)
    ccScroll.value = currentActiveCC.textContent
    
    function formatDateString(d){
        return  [d.getDate().toString().padStart(2,'0'),  (d.getMonth()+1).toString().padStart(2,'0'), d.getFullYear()].join('/') + 
                " " +
                [ d.getHours().toString().padStart(2,'0'), d.getMinutes().toString().padStart(2,'0')].join(":");
    }
}

/////////////////////////////////////////////////////////
//                  Selector for CC #                  //
/////////////////////////////////////////////////////////
function changeButtonColor(newActiveBut,currentActiveBut){
    if( currentActiveBut != null ){ //another is active
        currentActiveBut.style.background = ''; //deactive color from #008000
        currentActiveBut.parentElement.parentElement.bgColor = '';
    }
    
    newActiveBut.style.background ='#90EE90'//'#008000'
    newActiveBut.parentElement.parentElement.bgColor = '#90EE90';
    
    return newActiveBut
}

function selectActiveCC(CCA_results, selectedCC, T, P, E){
    
    //selecting all the plot elements
        //GSE v ES
    let GSE_plotDiv = document.getElementById('GES_ES_Plot');
    
        // CC plots
    let CC_P_plotDiv = document.getElementById('CCi_P_Plot');
    let CC_E_plotDiv = document.getElementById('CCi_E_Plot');
        // global P-E plots
    let P_plotDiv = document.getElementById('Power_Plot');
    let E_plotDiv = document.getElementById('Energy_Plot');
    
    
    let selectedCC_index = selectedCC - 1; // CC start at # 1 but array index at 0
    
    let T_cc = [ CCA_results.LTStart[ selectedCC_index ], CCA_results.CCTS.Load[ selectedCC_index ][1] ];
    let T_ccstart =  CCA_results.CCTS.Load[ selectedCC_index ][0];
    
    //configuring new x and y ranges for P and E
    let newTrange = T.slice(T_cc[0],T_cc[1]);  
    let startCCT = T[ T_ccstart ];
    
    let newPrange = P.slice( T_cc[0],T_cc[1] ) ;
    //~ let newPrange = [ Math.min.apply(Math, powerDataRange) ,Math.max.apply(Math, powerDataRange) ];
    
    let newErange = E.slice( T_cc[0],T_cc[1] ) ;
    //~ let newErange = [ Math.min.apply(Math, energyDataRange) ,Math.max.apply(Math, energyDataRange) ];
    //~ console.log(newYrange)
    
    let Tsme = [ newTrange[0] , startCCT, newTrange.at(-1) ]
    let Psme = [ newPrange[0], P[ T_ccstart ] ,  newPrange.at(-1) ] //start middle end T
    let Esme = [ newErange[0], E[ T_ccstart ] ,  newErange.at(-1) ] //start middle end T
    
      
    ///////////////////////////
    //        Power plot     //
    //////////////////////////
    
    let PowerLayout = {
        title: 'Power for Crit. Cap. # ' + (selectedCC), 
        showlegend: false,
        yaxis: {title: 'Power (P units)', fixedrange: true},
        xaxis : {title: 'Time (hr)', fixedrange: true},
        shapes: [{
            type: 'line',
            x0: startCCT, y0: 0,
            x1: startCCT, y1: 1,
            xref: 'x',
            yref: 'paper',
            line:{ color: 'rgb(255, 0, 0)', width: 4, dash:'dot'},
        }]
    };
    
    //new P plot
    Plotly.react( CC_P_plotDiv,
        [{ x: newTrange, y: newPrange, hovertemplate: 'P: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>'}],
        PowerLayout
    );
    
    //adding start, middle and end point markers
    Plotly.addTraces(CC_P_plotDiv, [{
        name:'Start - middle - end',
        y: Psme,
        x: Tsme,
        mode: 'markers',
        marker: {
            size: 20,
            color: ['rgb(100, 75, 75)', 'rgb(255, 0, 0)' ,'rgb(255, 0, 255)'], 
        },
        hovertemplate: 'P: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'
    }]);
    
    
    ///////////////////////////
    //       energy plot     //
    //////////////////////////
    let ELayout =  { 
        title: 'Energy for Crit. Cap. # ' + (selectedCC),
        showlegend: false,
        yaxis: {title: 'Energy (E units)', fixedrange: true},
        xaxis : {title: 'Time (hr)', fixedrange: true},
        shapes: [{
                type: 'line',
                x0: startCCT, y0: 0,
                x1: startCCT, y1: 1,
                xref: 'x',
                yref: 'paper',
                line:{ color: 'rgb(255, 0, 0)', width: 4, dash:'dot'}
        }],
        hovertemplate: 'E: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>',
        annotations: [{
            x: T[Math.round((T_ccstart+T_cc[1])/2)] ,//+(newTrange.at(-1) - startCCT)*0.2,
            y: Math.max(...newErange),   //(Math.max(...newErange)+Math.min(...newErange))/2,   //newErange[0]+(newErange.at(-1) - newErange[0])*0.2,
            text: '<b> CC magnitude </b>',
            font: { color: 'red', size: 24 },
            showarrow: false
        },
        {
            ax: startCCT,
            ay: Esme[1],
            arrowside: 'end',
            showarrow: true,
            arrowhead: 3,
            arrowcolor:'red',
            axref: 'x',
            ayref: 'y',
            x: Tsme[2],//+(newTrange.at(-1)-startCCT)*0.5,
            y: Esme[2],
        }
        ]
    };
    // new E plot
    Plotly.react( CC_E_plotDiv,
     [{ x: newTrange, y: newErange, hovertemplate: 'E: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>'}],
    ELayout
    );
    
    Plotly.addTraces(CC_E_plotDiv, [{
        name:'Start - middle - end',
        y: Esme,
        x: Tsme,
        mode: 'markers',
        marker: { 
            size: 20 ,        
            color: ['rgb(100, 75, 75)', 'rgb(255, 0, 0)' ,'rgb(255, 0, 255)'],            
            //~ colorscale: [[Tsme[0],'rgb(100, 75, 75)'], [Tsme[1], 'rgb(255, 0, 0)'], [Tsme[2],'rgb(255, 0, 255)']],
            },
        hovertemplate: 'E: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'
    }]);
     
    
    ///////////////////////////
    //   GSE vs ES marker   //
    //////////////////////////
    
    if( GSE_plotDiv.data.length >1 )
        Plotly.deleteTraces(GSE_plotDiv, 1);
    
    Plotly.addTraces(GSE_plotDiv, [{
        name:'Chosen CC',
        y: [CCA_results.GSE[selectedCC_index]],
        x: [CCA_results.CritCap.Load[selectedCC_index]],
        mode: 'markers',
        marker: {
            size: 20,
            symbol: 'star'
        },
        hovertemplate: 'GSE: %{y:.2f}' + '<br>' + 'CC: %{x:.2f}' + '<extra></extra>'
    }]);
    
    ///////////////////////////
    //   PE gloabl markers  //
    //////////////////////////
    // add additional lines on the energy and power time-series plot (x3, gen start, load start and end)
    
    let PE_sme_lines = { shapes: [{
                type: 'line',
                x0: Tsme[0], y0: 0,
                x1: Tsme[0], y1: 1,
                xref: 'x',
                yref: 'paper',
                line:{ color: 'rgb(100, 75, 75)', width: 4, dash:'dot'}
            },{
                type: 'line',
                x0: Tsme[1], y0: 0,
                x1: Tsme[1], y1: 1,
                xref: 'x',
                yref: 'paper',
                line:{ color: 'rgb(255, 0, 0)', width: 4, dash:'dot'}
            },{
            type: 'line',
            x0: Tsme[2], y0: 0,
            x1: Tsme[2], y1: 1,
            xref: 'x',
            yref: 'paper',
            line:{ color: 'rgb(255, 0, 255)', width: 4, dash:'dot'}
            }
        ]};
    
    Plotly.relayout( P_plotDiv, PE_sme_lines);
    Plotly.relayout( E_plotDiv, PE_sme_lines);
    
    
}



/////////////////////////////////////////////////////////
//         Adding imported Data to Plots               //
/////////////////////////////////////////////////////////

// Redraw each of the plots
function updatePlot( T, P, isEnergy = false, tStep){
    var E;
    
    var CCA_results = CCA(P,isEnergy,tStep);
    
    if(isEnergy){ //allows the raw energy data to be input, note this is the differential of energy e.g. E(t)=integral(P(t)),  delta_E(t)=E(t)-E(t-1) 
        E = P.map((sum => value => sum += value)(0));
        P = P.map( e => e/tStep);
    } else {
     E = CalcNetEnergy( P,tStep )   
    }

    //adding the GSE,P,E fixed traces. fixed in terms of unchanging based on input data.
    Plotly.react('Power_Plot',
        [{x: T ,y: P}], 
        {title: 'Power timeseries', xaxis:{title: 'Time (hr)'},yaxis:{title: 'Power (P Units)'} }
        );

    Plotly.react('Energy_Plot',
        [{x: T,y: E}],
        {title: 'Energy timeseries',xaxis:{title: 'Time (hr)'},yaxis:{title: 'Energy (E Units)'},hovermode: 'x unified' }
        );
    
    Plotly.react('GES_ES_Plot',
        [ {name:'GSE v E',x: CCA_results.CritCap.Load,y: CCA_results.GSE , mode: 'lines+markers' , hovertemplate: 'GSE: %{y:.2f}' + '<br>' + '  Es: %{x:.2f}' + '<extra></extra>'} ], 
        {title: 'GSE to Es trade-off', showlegend: false, xaxis:{title: 'Storage Capacity (E Units)'},yaxis:{title: 'GSE (E Units)'}}
        );
  
    fillCCTable( CCA_results, T, P, E)
    
    // set the 
    //~ Plotly.react('CCi_P_Plot',
        //~ [{x: T ,y: P,  hovertemplate: 'P: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'}], 
        //~ {title: 'Power for Crit. Cap. # ', showlegend: false , yaxis: {title: 'Power (P units)', fixedrange: true}, xaxis : {title: 'Time (hr)', fixedrange: true} }
        //~ );
        
    //~ Plotly.react('CCi_E_Plot',
        //~ [{x: T, y: E,  hovertemplate: 'E: %{y}' + '<br>' + 'T: %{x}' + '<extra></extra>'  }], 
        //~ {title: 'Energy for Crit. Cap. # ', showlegend: false,  yaxis: {title: 'Energy (E units)', fixedrange: true}, xaxis : {title: 'Time (hr)', fixedrange: true}} 
        //~ );
}


/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

//some magic here. TO find step size Z from a timeseries:
// Maths: Start time -testTime[0] = t0 then a timeseries of N len  with stepsizeZ,  
    // => sum(TimeSeries) = K = t0+ (t0+1*Z) + (t0+2*Z) + ... + (t0+ (N-1)*Z) 
    // Rearrange:  K= t0*N + Z*(1+2+...+(N-1)      => natrual numbers from 1+2+...+N = N*(N+1)/2
    // => K = t0*N + Z*((N-1)*(N-1+1))/2 
    // => K= t0*N  + Z( (N-1)* (N/2) )
//~ var tStep = (T.reduce((a,b) => a+b,0) - T[0]*(T.length)) / (T.length*(T.length-1)/2);
