from CCA import CCA,GSEfromCC
import numpy
import pandas as pd
## Testing SCRIPT

df=pd.read_csv('BalanceData.csv',sep=',',header=None)

BD=df.to_numpy()
 
CritCap, CycleType, CCTS,Einto,Einto_T=CCA(BD[0],True)

df=pd.read_csv('MatlabCCData.csv',sep=',',header=None)

MCC=df.values.tolist()

CompList=[]
for Mat,PCC in zip(CritCap[0],MCC[0]):
    CompList.append(Mat-round(PCC,2))
    
CCround=[]
for j in CritCap[0]:
    CCround=round(j,2)
print(CritCap[0])
print(numpy.sum(numpy.array(CompList)))
    