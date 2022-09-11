from CCA import CCA,GSEfromCC, findZeroCrossing,CalcNetEnergy
import numpy
## Testing SCRIPT

##energy calculation fun.
#~ print('Testing energy calculation')
#~ TestEnergyArray=numpy.array([1,5,2,7,1]).astype('float')
#~ print(CalcNetEnergy(TestEnergyArray))
##SepByNan fun.
#~ print('Testing seperation by NaN')
#~ TestSepByNaN=numpy.array([1, 2, 3, numpy.NaN , 5,numpy.nan, 3, numpy.NaN ,2 ,1]).astype('float')

#~ TS=sepByNan(TestSepByNaN)
#~ print(Sec)
#~ print(TS)
#~ print('Expected Output: [ [0, 2], [4, 4], [6, 6], [8, 9] ] ')
## findEnergyExtrema 
##       part 1

#~ TestLMM=numpy.array([1, 5, 1]).astype('float')
#~ TestLMM=numpy.array([10, 5, 1, -7, -2, -1, 7, 3, 1, -5, -2, -7]).astype('float')
#~ TestLMM_E=CalcNetEnergy(TestLMM);
#~ print(['{:.1f}'.format(x) for x in TestLMM_E])
#~ print("ENERGY: "+ str(TestLMM_E))

#~ print('Expected Output: Section- Pos [6, 10] & Neg [-9 -10], Time-Pos [[0, 2], [6,8]] & neg [[3,5],[9,11]]')
#~ ,Ext=findEnergyExtrema(TestLMM_E)

#~ print(Ext)

#part 2
#~ #final expected output
#~ TestLMM=numpy.array([10, 5, 1, -7, -2, -1, 7, 3, 1, -5, -2, -7]).astype('float')
#~ TestLMM_E=CalcNetEnergy(TestLMM);
#~ print('Expected Output: Section- [10.5, -10, 11, -14] Time-[[0, 2], [3,5],[6,8],[9,11]')
#~ Ext=findZeroCrossing(TestLMM)

#~ print('Extrema: ' +str(Extrema))
#~ print('Ext: ' +str(Ext))

#~ print('')
## CCA 

CCATest=numpy.array([10, 5, 1, -5, -2, -1, 7, 3, 1, -5, -1, -7]).astype('float')

CritCap, CycleType, CCTS,Einto,Einto_T=CCA(CCATest,True)
print('CritCap') 
print('        ' + str(CritCap))

#~ print('CycleType')
#~ print(CycleType)

print('CCTS')
print('        ' + str(CCTS))

#~ print(Einto)
#~ print(Einto_T)

#~ CritCap[0].append(0)
#~ #testing GSEfromCC function
#~ for CC in CritCap[0]:
    #~ print(GSEfromCC(CC,CritCap[0]))
    
#~ print(CritCap)




#~ CCATest2=numpy.array([0, 10, -8, 20, -5]).astype('float')

#~ CritCap, CycleType, CCTS,Einto,Einto_T=CCA(CCATest2,True)

#~ print('other test')
#~ print(CritCap)