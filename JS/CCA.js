
function CCA(NP, isEnergy = false ,dt = 1){
    
    let ExtermaList=[];
    if(isEnergy){ // Find extreme in energy
        NE = NP
        NE.unshift(0)

        ExtermaIndex = findZeroCrossing(NE)
       
        for(const EI of ExtermaIndex){
            Start = EI[0]
              End = EI[1]
            //extract section where extrema is and find total energy.
            Energy_Extrema = (NE.slice(Start,End+1)).reduce((a,b)=> a+b,0)
            ExtermaList.push(Energy_Extrema);
        }
        //perform comulative sum
        ExtermaList=ExtermaList.reduce((a, b, i) => [...a, b + (a[i-1] || 0)], []);
    } else {
        NE = CalcNetEnergy(NP,dt)
        //Perform difference
        NEdiff = NE.map((v, i, a) => v - (a[i - 1] || 0));
        ExtermaIndex = findZeroCrossing(NEdiff)
        
        for (const j in ExtermaIndex){
            ExtermaList.push( NE [ ExtermaIndex[j][1] ])
        }
    }
    
    //peform CCA return an object containing
        //Critcap: Gen CC and Load CC
        //Cycle types: Gen and Load
        //CCTS: Gen and Load
        //Einto
        //Einto_TS
    CCanalysis = ModRainflowAlgoritm(ExtermaList,ExtermaIndex)
    
    return CCanalysis

}

function ModRainflowAlgoritm(ExtermaList, ExtermaIndex){
    //Adding dummy zero to start of extermal ist
    ExtermaList.unshift(0);
    ExtermaIndex.unshift([0,0]);
    
    //stacks  used to store data where S triggers the check condition for identification  
    let Es  = [];// exterma's  stack
    let CT = []; //time indicies
    
    //outputs 
    let GenCC  = []
    let LoadCC = []
    //CritCap=[ LoadCC, GenCC ] 
    
    let GenCycleType  = []
    let LoadCycleType = []
    //CycleType=[LoadCycleType, GenCycleType] 
    
    let GenTS  = []
    let LoadTS = []
    //CCTS=[LoadTS, GenTS]
    
    let Einto    = [] // energy injected into TS
    let Einto_T = []
    
//Three phases, A) dealing with cycles, B) dealing with residues and, C)  Sorting output:
    //Phase A, dealing with cycles
    for(let idx = 0 ; idx< ExtermaList.length ; idx++){
        Es.push( ExtermaList[idx] );
        CT.push(idx);
        

        while(Es.length >= 3 && Math.abs( Es.at(-2) - Es.at(-3) ) <= Math.abs( Es.at(-1) - Es.at(-2) ) ){
            ampl = Math.abs( Es.at(-2) - Es.at(-3) );
        
         //Two parts, A1) find half cycles and, A2) find full cycles.  Note half cycles are either left or right hand side of rainflow while full are on both sides
            //part A1: Find any half cycles
            if(Es.length ==3){
                startT = CT[0]; 
                endT = CT [1];
                
                if ( (Es[1]-Es[0]) > 0 && (Es[2]-Es[1]) < 0) {                              // value on "right hand side" of rainflow plot (gen cc)
                    GenCC.push(ampl)
                    GenCycleType.push(0.5)
                    GenTS.push( [ ExtermaIndex[startT][1], ExtermaIndex[endT][1] ] )
                    
                    if (Es[0]<0){ //additional energy is injected at start of time series
                        Einto.push(Es[0])
                        Einto_T.push(ExtermaIndex[startT][0])
                    }
                } else{ //value on left hand side of rainflow plot (load CC)
                    LoadCC.push(ampl)
                    LoadCycleType.push(0.5)
                    LoadTS.push([ ExtermaIndex[startT][0],ExtermaIndex[endT][1]+1 ] )
                }
                Es.shift();
                CT.shift();
         //Part A2: find the full cycles (both gen&load cc)
            } else { 
                startT = CT.at(-3); 
                endT = CT.at(-2);
                
                GenCC.push(ampl)
                GenCycleType.push(1)
                
                LoadCC.push(ampl)
                LoadCycleType.push(1)
                
                //Track time index of both CC's
                if( Es.at([-2]-Es[-3])>0 ) { // transition from low to high 
                    LoadTS.push( [ ExtermaIndex[startT+1][0], ExtermaIndex[endT][1]+1 ] )
                    GenTS.push( [ ExtermaIndex[startT][1], ExtermaIndex[endT][1]] )
                } else{ //transition from high to low
                    LoadTS.push( [ ExtermaIndex[startT+1][0], ExtermaIndex[endT][1] ] )
                    GenTS.push( [ ExtermaIndex[startT][0], ExtermaIndex[startT][1]] )
                }
                //Remove s[-3] and s[-2],  hence s[-1] moves back two positions.
                Es.splice(-3,2)
                CT.splice(-3,2)
                }
        }
    }
    // Phase B: Dealing with residues
        //These are "half cycles" either Left hand side or right hand side of curve numbered with 0 for residue
    for(let idx = 0;  idx< Es.length-1 ;  idx++) {
        Ecurrent = Es[ idx ];
        Enext     = Es[ idx+1];
        
        ampl   = Ecurrent-Enext
        
        startT = CT[idx];
        endT   = CT[idx+1]
        
        if( ampl > 0){ //LHS of curve
            LoadCC.push(ampl);
            LoadCycleType.push(0);
            LoadTS.push( [ ExtermaIndex[startT+1][0],ExtermaIndex[endT][1] ] );
        } else{ //RHS of curve
            GenCC.push(Math.abs(ampl));
            GenCycleType.push(0);
            GenTS.push( [ ExtermaIndex[startT][0], ExtermaIndex[endT][1] ] );
            
            if( Ecurrent < 0 ){ // This would be injected energy into the time series
                Einto.push(Es[0]);
                Einto_T.push(ExtermaIndex[startT][0]);
            }
        }
    }
// Phase C:  sorting outputs
    //sort loadCC then use its indexing to sort i) LoadCCTs, ii) LoadCycleType
    
    let Lcc_idxsort = Array.from(Array(LoadCC.length).keys())
                                     .sort((a, b) => LoadCC[a] < LoadCC[b] ? -1 : (LoadCC[b] < LoadCC[a]) | 0);
    
    LoadCC   = Lcc_idxsort.map( i => LoadCC[i] ).reverse();
    LoadTS = Lcc_idxsort.map( i => LoadTS[i] ).reverse();
    LoadCycleType = Lcc_idxsort.map( i => LoadCycleType[i] ).reverse();
    
    
    // CREATING OUTPUT OBJECT
        //Critcap: Gen CC and Load CC
        //Cycle types: Gen and Load
        //CCTS: Gen and Load
        //Einto
        //Einto_T
    CCA_out = { CritCap: {Gen: GenCC , Load: LoadCC} ,
                      CycleTypes: {Gen: GenCycleType, Load: LoadCycleType},
                      CCTS: {Gen: GenTS , Load: LoadTS},
                      Einto: Einto,
                      Einto_T: Einto_T
                  }
                  
      return CCA_out     
}

function findZeroCrossing(NE){
    P=[...NE];
    N=[...NE];
    
    
    if (NE[0]==0){  
        if (NE.find(a=> a!=0)>0){//Finds first non-zero value in NE 
             //all elements in P which are not positive are set to NaN  && All elements in N which are not negative are set to NaN
            P.forEach( (val,ind,arr)=> {if(val<0){arr[ind]=NaN}})
            N.forEach( (val,ind,arr)=> {if(val>=0){arr[ind]=NaN}}) 
        } else{
            P.forEach( (val,ind,arr)=> {if(val<=0){arr[ind]=NaN}})
            N.forEach( (val,ind,arr)=> {if(val>0){arr[ind]=NaN}}) 
        }
    } else{
        P.forEach( (val,ind,arr)=> {if(val<=0){arr[ind]=NaN}})
        N.forEach( (val,ind,arr)=> {if(val>0){arr[ind]=NaN}}) 
    }
    
    maxTimes = SepByNaN(P)
    minTimes = SepByNaN(N)
    
    ExtermaIndex = [];
    
    if(maxTimes.length == 0)
        ExtermaIndex = minTimes;
    else if(minTimes.length ==0)
        ExtermaIndex = maxTimes;
    else if(maxTimes[0][0] == 0)
        ExtermaIndex = interleaveLists(maxTimes,minTimes);
    else if( minTimes[0][0] == 0) 
        ExtermaIndex = interleaveLists(minTimes,maxTimes);
     else
        throw "Could not find max or min in input";
    
    return ExtermaIndex
    
}

//Interleaves list 2's elements with list 2's elements, e.g. [L1a, L2a, L1b, L2b ...]
// used to recosntruct the positive and negative extrema into a single list
function interleaveLists(L1,L2){
        return [L1, L2]
                    .reduce((r, a) => (a.forEach((a, i) => (r[i] = r[i] || []).push(a)), r), [])
                    .reduce((a, b) => a.concat(b));
    
    //~ return  L1.reduce(function(arr, v, i) {
                                //~ return arr.concat([v], [L2[i]]); 
                                //~ }, []);
}

// Split an array if it contains nan, e.g. [a,b,c, NaN,NaN, e f g] seperates into two groups [a,b,c],[e,f,g]. We discard the section since we only need the time index.
function SepByNaN(A){
    if  (! isNaN(A.at(-1)) )
        A.push(NaN);
    
    Idx2 = A.reduce(function(a, e, i) {
                    if (isNaN(e))
                        a.push(i);
                    return a;
                }, []);
                
    Idx1 = Idx2.slice(0,-1).map( e => e+1);
    Idx1.unshift(0) 
                
    TimeRecord = []
    for(const j in Idx2){
        if (Idx1[j] < Idx2[j])
            TimeRecord.push([Idx1[j], Idx2[j]-1]);
    }
    
    return TimeRecord
}


function CalcNetEnergy(NP, dt = 1){
    //line 204 of py
    NE = new Array(NP.length)
    NE[0] = 0;
    
    for(let t = 1; t< NP.length ; t++){
      NE[t] = NE[t-1]  + dt*( NP[t]  + NP[t-1])/2  // Trapzodial approximation
    }
    return NE
}
