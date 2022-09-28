const ccButList = {active: null} ;

function fillCCTable(CCA_results){
    
    let tableDataDisplay = document.getElementById('tableDataDisplay');
    
    //listen to the table for button presses
    tableDataDisplay.addEventListener('click',(event)=>{
          const isButton = (event.target.nodeName === 'BUTTON');  
            if (!isButton){return;}
            selectActiveCC(event.target)
        });
            
        
    CC = CCA_results.CritCap.Load;
    // Calc the GSE and push the values into the table
    for(let j = 0; j < CC.length; j++){

        //Table entry
        let newRow= tableDataDisplay.insertRow(-1);
        
        
        //create the crit cap # and add button
        let newCell = newRow.insertCell(0)
        let But_ccSelc  = document.createElement('Button');
        
        But_ccSelc.style.height = '20px';
        But_ccSelc.style.width  = '30px';
        But_ccSelc.style['vertical-align'] = 'inherit' ;
        But_ccSelc.textContent = (j+1).toString();
        
        ccButList[j] = But_ccSelc; // add button to list of all buttons

        
        //~ newCell.append(newcellTxt);
        newCell.appendChild(But_ccSelc);
        

        //magnitude
        newCell    = newRow.insertCell(1)
        newcellTxt = document.createTextNode(CC[j].toFixed(1));
        newCell.appendChild(newcellTxt);
        
        //GSE
        newCell    = newRow.insertCell(2)
        newcellTxt = document.createTextNode(CCA_results.GSE[j].toFixed(1));
        newCell.appendChild(newcellTxt);
        

        //StartT w/ gen
        newCell    = newRow.insertCell(3)
        newcellTxt = document.createTextNode( testTime[ CCA_results.LTStart[j] ] );
        newCell.appendChild(newcellTxt);
        
        //StartT
        newCell    = newRow.insertCell(4)
        newcellTxt = document.createTextNode( testTime[ CCA_results.CCTS.Load[j][0] ] );
        newCell.appendChild(newcellTxt);
        
       //EndT
        newCell    = newRow.insertCell(5)
        newcellTxt = document.createTextNode(testTime[ CCA_results.CCTS.Load[j][1] ]);
        newCell.appendChild(newcellTxt);
        
        //InnerCC
        newCell    = newRow.insertCell(6)
        newcellTxt = document.createTextNode('Not Imp');
        newCell.appendChild(newcellTxt);
    }
}


function selectActiveCC( buttonClicked ){
    
    if( ccButList.active != null ){ //another is active
        
        ccButList.active.style.background = ''; //deactive color from #008000
        ccButList.active.parentElement.parentElement.bgColor = '';
        
    }
    
    ccButList.active = buttonClicked
    
    ccButList.active.style.background ='#90EE90'//'#008000'
    ccButList.active.parentElement.parentElement.bgColor = '#90EE90';
    
    let currentCC = Number(ccButList.active.textContent) - 1; // this is stored 1 to n hence -1 to get actual index
    
    
    // this is temp based on the temp data
    let PowerData = energyData;
    let Eaccum = energyData.map((sum => value => sum += value)(0))
    
    //
    T_cc = [ CCA_results.LTStart[ currentCC ], CCA_results.CCTS.Load[ currentCC ][1] ];
    
    //~ console.log(T_cc)
    //configuring new x and y ranges for P and E
    let newXrange = [ testTime[T_cc[0]] , testTime[T_cc[1]] ];  
    let startCCT = testTime[ CCA_results.CCTS.Load[ currentCC ][0] ];
    
    let powerDataRange = PowerData.slice( T_cc[0],T_cc[1] ) ;
    let newPrange = [ Math.min.apply(Math, powerDataRange) ,Math.max.apply(Math, powerDataRange) ];
    
    let energyDataRange = Eaccum.slice( T_cc[0],T_cc[1] ) ;
    let newErange = [ Math.min.apply(Math, energyDataRange) ,Math.max.apply(Math, energyDataRange) ];
    //~ console.log(newYrange)
      
    //Rezoom power plot
    Plotly.relayout('CCi_P_Plot', { 
        'xaxis.range' : newXrange ,
        'yaxis.range' : newPrange ,
        shapes: [{
            type: 'line',
            x0: startCCT,
            y0: newPrange[0],
            x1: startCCT,
            y1: newPrange[1],
            line:{
                color: 'rgb(255, 0, 0)',
                width: 4,
                dash:'dot'
            },
        }],
        hovermode: 'x unified', 
        hovertemplate: 'P: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>'
    });
    
    //Rezoom energy plot
    Plotly.relayout('CCi_E_Plot', { 
        'xaxis.range' : newXrange ,
        'yaxis.range' : newErange, 
        shapes: [{
                type: 'line',
                x0: startCCT,
                y0: newErange[0],
                x1: startCCT,
                y1: newErange[1],
                line:{
                    color: 'rgb(255, 0, 0)',
                    width: 4,
                    dash:'dot'
                }
        
        }],
        hovermode: 'x unified', 
        hovertemplate: 'E: %{y}' + '<br>' + ' T: %{x}' + '<extra></extra>',
        annotations: [{
            x: startCCT+(newXrange[1]-startCCT)*0.2,
            y: newErange[0]+(newErange[1]-newErange[0])*0.2,
            text: '<b> CC load energy this side </b>',
            font: { color: 'red', size: 24 },
            showarrow: false
        },
        {
            ax: startCCT,
            ay: newErange[0]+(newErange[1]-newErange[0])*0.3,
            arrowside: 'end',
            showarrow: true,
            arrowhead: 1,
            arrowcolor:'red',
            axref: 'x',
            ayref: 'y',
            x: startCCT+(newXrange[1]-startCCT)*0.5,
            y: newErange[0]+(newErange[1]-newErange[0])*0.3,
            
        }
        
        
        ]
    });
     
    
    //add highlight (star) on the CCA plot
    let GSE_plotDiv = document.getElementById('GES_ES_Plot');
    if( GSE_plotDiv.data.length >1 ) {// delete old highlight
        
        Plotly.deleteTraces(GSE_plotDiv, 1);
    }
    
    Plotly.addTraces(GSE_plotDiv, [{
                                    name:'Chosen CC',
                                    y: [CCA_results.GSE[currentCC]],
                                    x: [CCA_results.CritCap.Load[currentCC]],
                                    mode: 'markers',
                                    marker: {
                                        size: 20,
                                        symbol: 'star'
                                    },
                                    hovertemplate: 'GSE: %{y:.2f}' + '<br>' + 'CC: %{x:.2f}' + '<extra></extra>'
                                }]);
                                
                                
    //~ console.log(CCA_results.GSE[currentCC])
    //~ console.log(CCA_results.CritCap.Load[currentCC])

}


