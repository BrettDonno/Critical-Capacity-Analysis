import numpy

##Core functions
#CCA
#GSEfromCC

#calculate crit cap analysis on given net power data (numpy array)
def CCA(NP, isEnergy=False,dt=1):
    
    #Reduce net energy to only local max/min. If net power is given calc net energy. If net energy is given use it.
    if isEnergy:
        NE=numpy.insert(NP,0,0) # when input is energy not power.
        ExtermaIndex=findZeroCrossing(NE)
        
        print('ExtermaIndex length')
        print('             ' + str(len(ExtermaIndex)))
        ExtermaList=[]
        for EI in ExtermaIndex:
            ExtermaList.append( numpy.sum( NE[ EI[0]:EI [1]+1 ] ) )
            
        ExtermaList=numpy.cumsum(ExtermaList).tolist()
        
        #~ print('ExtermaList')
        #~ print('        ' + str(ExtermaList))
    else:
        #Calc net energy NE
        NE=CalcNetEnergy(NP,dt)
        NEdiff=numpy.diff(NE,prepend=0)
        ExtermaIndex=findZeroCrossing(NEdiff)
        ExtermaList=[NE[x[1]] for x in ExtermaIndex]
    
    #Modified version of the rainflow algorithm
    #Inputs: ExtermaList  && ExtermaIndex
    #outputs  List formats: [ [ LoadCC ] , [ GenCC ] ] ## List names: CritCap , CycleType, CCTS, ##No format: Einto,Einto_T
    CritCap, CycleType, CCTS,Einto,Einto_T=ModRainflowAlgoritm(ExtermaList,ExtermaIndex)
    
    return CritCap, CycleType, CCTS,Einto,Einto_T
    
#calulate GSE for given storage Es using list of Crit Cap cc 
def GSEfromCC(Es,CC):
    CCa=numpy.array(CC) # numpyarray is easier to use for calculation
    return 1/2*numpy.sum(CCa-Es+abs(CCa-Es));
    
## Helper functions
def ModRainflowAlgoritm(ExtermaList, ExtermaIndex):
    #Adding dummy zero to start of extermal ist
    ExtermaList.insert(0,0)
    ExtermaIndex.insert(0,[0,0])
    
    #stacks  used to store data where S triggers the check condition for identification  
    Es=[];# exterma's  stack
    CT=[]; #time indicies
    
    #outputs 
    GenCC=[]
    LoadCC=[]
    #CritCap=[ LoadCC, GenCC ] 
    
    GenCycleType=[]
    LoadCycleType=[]
    #CycleType=[LoadCycleType, GenCycleType] 
    
    GenTS=[]
    LoadTS=[]
    #CCTS=[LoadTS, GenTS]
    
    Einto=[] # energy injected into TS
    Einto_T=[]
    
    for idx,Exterma in enumerate(ExtermaList):
        Es.append(Exterma) 
        CT.append(idx);
        ##Three phases, A) dealing with cycles, B) dealing with residues and, C)  Sorting output:
        ##Phase A, dealing with cycles
        while len(Es) >= 3 and abs(Es[-2]-Es[-3]) <= abs(Es[-1]-Es[-2]):
            ampl=abs(Es[-2]-Es[-3]) # of the Cycles
            
            #Two parts, A1) find half cycles and, A2) find full cycles.  Note half cycles are either left or right hand side of rainflow while full are on both side
            #part A1: Find any half cycles
            if len(Es) == 3:
                startT=CT[0]; endT=CT[1]
                
                if (Es[1]-Es[0]) > 0 and (Es[2]-Es[1]) < 0:                               # value on "right hand side" of rainflow plot (gen cc)
                    GenCC.append(ampl)
                    GenCycleType.append(0.5)
                    GenTS.append( [ ExtermaIndex[startT][1], ExtermaIndex[endT][1] ] )
                    
                    if Es[0]<0: #additional energy is injected at start of time series
                        Einto.append(Es[0])
                        Einto_T.append(ExtermaIndex[startT][0])
                else:                                                                           #Value on left hand side of rainflow plot (Load CC)
                    LoadCC.append(ampl)

                    LoadCycleType.append(0.5)
                    LoadTS.append( [ ExtermaIndex[startT][0],ExtermaIndex[endT][1]+1 ] )
                #remove first element from the stack
                del Es[0] 
                del CT[0]
                
            #Part A2: find the full cycles (both gen&load cc)
            else:
                startT=CT[-3]; endT=CT[-2]
                
                GenCC.append(ampl)
                GenCycleType.append(1)
                
                LoadCC.append(ampl)
                LoadCycleType.append(1)
                
                #Track time index of both CC's
                if (Es[-2]-Es[-3])>0: #transition from low to high 
                    LoadTS.append( [ ExtermaIndex[startT+1][0], ExtermaIndex[endT][1]+1 ] )
                    GenTS.append( [ ExtermaIndex[startT][1], ExtermaIndex[endT][1]] )
                else: #transitionf rom high to low
                    LoadTS.append( [ ExtermaIndex[startT+1][0], ExtermaIndex[endT][1] ] )
                    GenTS.append( [ ExtermaIndex[startT][0], ExtermaIndex[startT][1]] )
                #Remove s[-3] and s[-2],  hence s[-1] moves back two positions.
                del Es[-3:-1]
                del CT[-3:-1]
    #~ print(Es)
    ##Phase B: Dealing with residues
    #These are "half cycles" either Left hand side or right hand side of curve numbered with 0 for residue
    for idx,Ecurrent in enumerate(Es[:-1]):
        Enext=Es[idx+1]
        ampl=Ecurrent-Enext
        
        startT=CT[idx]; endT=CT[idx+1]
        
        if(ampl>0): #LHS of curve

            LoadCC.append(ampl)
            LoadCycleType.append(0)
            LoadTS.append( [ ExtermaIndex[startT+1][0],ExtermaIndex[endT][1] ] )
        else: #RHS
            GenCC.append(abs(ampl))
            GenCycleType.append(0)
            GenTS.append( [ ExtermaIndex[startT][0], ExtermaIndex[endT][1] ] )
            if Ecurrent<0: # This would be injected energy into the time series
                Einto.append(Es[0])
                Einto_T.append(ExtermaIndex[startT][0])
    
    ## Phase C:  sorting outputs
    LoadCC,LoadTS,LoadCycleType=zip(*sorted(zip(LoadCC,LoadTS,LoadCycleType), reverse=True))
    LoadCC=list(LoadCC);LoadTS=list(LoadTS); LoadCycleType=list(LoadCycleType)
    
    ## formatting for output
    CritCap=[ LoadCC, GenCC ]
    CycleType=[LoadCycleType, GenCycleType ] 
    CCTS=[LoadTS,GenTS]

    return CritCap, CycleType, CCTS,Einto,Einto_T
            

##Finds local max/min
def findZeroCrossing(NE):
    #Duplicating NE to calc both postiive and negative sides for local max/mins 
    P=numpy.copy(NE) ;N=numpy.copy(NE)
    
    #inital value ==0
    if NE[0]==float(0):
        firstNonZero=numpy.nonzero(NE)[0][0];
        if(NE[firstNonZero]>0): # first period is positive so neg list should ignore it
            P[P<0]   = numpy.nan
            N[N>=0] = numpy.nan
        else: #first period is negative so positive list should ignore it.
            P[P<=0] = numpy.nan
            N[N>0]   = numpy.nan
    else: #default case
        P[P<=0] = numpy.nan
        N[N>0]   = numpy.nan
        
    #local max/min periods
    maxTimes=sepByNan(P)
    minTimes=sepByNan(N)
    ExtermaIndex=[] 
    
    #Default cases: local min's only, OR local max only
    if not maxTimes: #only mins
        ExtermaIndex = minTimes
    elif not  minTimes: #only max
        ExtermaIndex = maxTimes
     #Reconstructing local max/min  (what is first?)
    elif maxTimes[0][0]==0: #max first. Interleave Max/Min/MAX
        ExtermaIndex = interleaveLists(maxTimes,minTimes)
    elif minTimes[0][0]==0: #as above but opposite Min/Max/Min
        ExtermaIndex = interleaveLists(minTimes,maxTimes)
    else:
        raise EmptyInputError("Could not find max or min in input")
        
    #~ print('Max length: ' +str(len(maxTimes)) + '    Min Times: ' + str(len(minTimes)))
    return ExtermaIndex

##Split an array if it contains nan, e.g. [a,b,c, NaN,NaN, e f g] seperates into two groups [a,b,c],[e,f,g]. We discard the section since we only need the time index.
def sepByNan(A):
    if not numpy.isnan(A[-1]): # add nan to end to close off the array
        A=numpy.append(A,numpy.nan)

    idx2, = numpy.where(numpy.isnan(A)) #idx2 (index 2) references all the NaN positions. Used for indexing the end of a section
    idx1  = numpy.insert(idx2[:-1]+1 , 0 , 0)  #Size(idx2)==size(idx1) #idx1 (index 1) references the right shifted of NaN positions starting at 0. Used to index the start of a section.
    
    
    #~ print('idx2')
    #~ print(idx2)
    #~ print('idx1')
    #~ print(idx1)
    #List of sections. e.g. [x1 x2 NaN NaN x3 x4] has two sections, [x1 x2] & [x3 x4]  and time records [0 1] &[4 5]
    #~ Sections=[]
    TimeRecord=[];
    
    for secStart, secEnd in zip(idx1,idx2): 
        if(secStart < secEnd):
            #~ Sections.append(A[secStart:secEnd])
            TimeRecord.append([secStart, secEnd-1])
            
    #~ return Sections,TimeRecord
    return TimeRecord
    
##Net energy calculation
def CalcNetEnergy(NP,dt=1):
    NE=numpy.empty(NP.size,dtype='float')
    NE[0]=float(0)
    for t in range (1,NE.size):
        NE[t]=NE[t-1]+dt*(NP[t] + NP[t-1])/2; # E(t)=E(t-1) + dt*(P(t) + P(t-1))/2; Trapzodial approximation
    return NE

    
##Interleaves list 2's elements with list 2's elements, e.g. [L1a, L2a, L1b, L2b ...]
## used to recosntruct the positive and negative extrema into a single list
def interleaveLists(L1, L2):
    L3 = [None] * (len(L1)+len(L2)) #initilise a list with enough space
    L3[::2]  = L1
    L3[1::2] = L2 
    return L3

#################################################################
##FUNCTION DOCUMENTATION
### FUNCTION 1
# CCA(NP, dt=1) - Performs  critical capacity analysis for given net power time series.
#~ inputs: 
#~                NP 1xn-> input data containing the net generation power time series
#~                time series 1xn-> timeseries data (for when the input data
#~                                  is not in hrs, hence the 
#~ outputs: 
#~              object containing:        
#~                CC 1xm matrix-> Output Data containing m Critical capacities
#~                CC_t 2xm matrix  - the time interval associated with each critical capacity [Start end]
#~                GenCC 2xm matrix - time interval associated with each potential spillage
#~                GenCC_t          - A list of potential Spillage energy values. These are the "right hand" (non CC) side of the rainflow plot
#~                Einto            - Additional amount of energy required to be injected at the start of the time series usualy as GSE
#~                Einto_t          - time of when injected energy is needed
#~                CycleType        - [2xn] matrix, row 1 for CC row 2 for Gen_CC. Each C can bea result of a half cycle, full cycle, residue cycle or unclosed.
#~                                   In this vector these cycles are recorded by 0.5-half cycle or 1-full cycle. Residal are 0. Unclosed cycles -1  cycle
#~                                   Full cycles means a CC is in both pos&neg liste. Half cycles have only in one of the pos or neg list. 
#~                                   Residue are found in a the 2nd half of algorithm and
#~                                   unclosed represents the  raindrop  falls off the end of the time series (at least 1 must) 

###Function 2
# CalcNetEnergy(NP,dt=1):   - calculates Net energy timeseries
    #Called by CCA

###Function 3
#findZeroCrossing(NE)  - calculates local max/min and its  index. for net energy NE
#       Called by CCA

###Function 4
# SepNaN(A,options) - Seperates a input matrix of 1xN into a cell array of various sizes where each entry is seperated by NaN. 
# Called by findZeroCrossing
#   The time index of the range is also returned.
#    [SepCell, TimeSeperated]=SepNaN(A) 
        #inputs: 
           #A 1xn-> input data desired to be seperated by NaN e.g. [1 2 3 NaN NaN 2 1] becomes {[1 2 3],{2,1]}
        #outputs: 
            #SepCell 1xM cell-> Output Data containing M cell elements
            #TimeSeperated 2xm matrix -> the time interval associated with  cell element for Seperated data, shows the start and end point in the original data in the form: [Start end]

### Function 5
#interleaveLists(L1,L2)  -  Join two lists togther by interleaves them, e.g. [L1a, L2a, L1b, L2b]



