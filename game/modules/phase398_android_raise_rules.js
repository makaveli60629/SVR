/* PHASE-398-ANDROID-RAISE-SIZING-RULES-LOCK */
export const RAISE_RULES_BUILD='PHASE-398-ANDROID-RAISE-SIZING-SMOOTHNESS-LOCK';
export const CHIP_STEP=50;
export const OPENING_MINIMUM=100;
export const roundToChip=value=>Math.max(0,Math.round(Number(value||0)/CHIP_STEP)*CHIP_STEP);
export const callAmount=(currentBet,streetBet,stack)=>Math.max(0,Math.min(Number(stack||0),Number(currentBet||0)-Number(streetBet||0)));
export function minimumRaiseTo(currentBet,lastFullRaiseSize=OPENING_MINIMUM){
  const bet=Math.max(0,Number(currentBet||0));
  const increment=Math.max(OPENING_MINIMUM,Number(lastFullRaiseSize||OPENING_MINIMUM));
  return bet===0?OPENING_MINIMUM:bet+increment;
}
export function isFullRaise(previousBet,newBet,lastFullRaiseSize=OPENING_MINIMUM){
  const oldBet=Math.max(0,Number(previousBet||0)),next=Math.max(0,Number(newBet||0));
  const required=oldBet===0?OPENING_MINIMUM:Math.max(OPENING_MINIMUM,Number(lastFullRaiseSize||OPENING_MINIMUM));
  return next>oldBet&&(next-oldBet)>=required;
}
export function potSizedRaiseTo({pot=0,currentBet=0,streetBet=0,fraction=1}){
  const bet=Math.max(0,Number(currentBet||0)),mine=Math.max(0,Number(streetBet||0));
  const call=Math.max(0,bet-mine),potAfterCall=Math.max(0,Number(pot||0))+call;
  if(bet===0)return roundToChip(Math.max(OPENING_MINIMUM,potAfterCall*Math.max(.1,Number(fraction||1))));
  return roundToChip(bet+potAfterCall*Math.max(.1,Number(fraction||1)));
}
export function legalRaiseWindow({currentBet=0,lastFullRaiseSize=OPENING_MINIMUM,streetBet=0,stack=0,raiseLocked=false}){
  const max=Math.max(0,Number(streetBet||0)+Number(stack||0));
  const min=minimumRaiseTo(currentBet,lastFullRaiseSize);
  return {min,max,canRaise:!raiseLocked&&max>=min};
}
