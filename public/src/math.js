// A small bounded Pratt parser. No eval, Function, object access or assignments.
export function calculate(expression){
 if(typeof expression!=='string'||expression.length>300)throw Error('Use an arithmetic expression of at most 300 characters.');
 const tokens=expression.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[()+\-*/%^,]/g)||[];
 if(tokens.join('')!==expression.replace(/\s/g,''))throw Error('Unsupported calculator characters.');
 if(tokens.length>160)throw Error('Expression is too complex.');let i=0,depth=0;
 const functions={sqrt:Math.sqrt,abs:Math.abs,round:Math.round,floor:Math.floor,ceil:Math.ceil,min:Math.min,max:Math.max,pow:Math.pow};
 const binding={'+':10,'-':10,'*':20,'/':20,'%':20,'^':30};
 function expr(min=0){if(++depth>24)throw Error('Expression nesting is too deep.');let t=tokens[i++],left;
  if(t==='+'||t==='-'){const x=expr(29);left=t==='-'?-x:x;}
  else if(t==='('){left=expr();if(tokens[i++]!==')')throw Error('Missing closing parenthesis.');}
  else if(/^(?:\d|\.)/.test(t||''))left=Number(t);
  else if(t==='pi')left=Math.PI;else if(t==='e')left=Math.E;
  else if(Object.hasOwn(functions,t)){if(tokens[i++]!=='(')throw Error('Function needs parentheses.');const args=[expr()];while(tokens[i]===','){i++;args.push(expr());if(args.length>8)throw Error('Too many arguments.');}if(tokens[i++]!==')')throw Error('Missing closing parenthesis.');if(t==='pow'&&args.length!==2)throw Error('pow requires two arguments.');if(!['min','max','pow'].includes(t)&&args.length!==1)throw Error('Function requires one argument.');left=functions[t](...args);}
  else throw Error('Expected a number or supported function.');
  while(Object.hasOwn(binding,tokens[i])&&binding[tokens[i]]>=min){const op=tokens[i++],right=expr(binding[op]+(op==='^'?0:1));if(op==='+')left+=right;if(op==='-')left-=right;if(op==='*')left*=right;if(op==='/')left/=right;if(op==='%')left%=right;if(op==='^')left=Math.pow(left,right);}
  depth--;if(!Number.isFinite(left))throw Error('The calculation is undefined or outside the supported range.');return left;
 }
 const value=expr();if(i!==tokens.length)throw Error('Unexpected calculator input.');return {expression,value};
}
const units={m:['length',1],km:['length',1000],cm:['length',.01],mm:['length',.001],mi:['length',1609.344],ft:['length',.3048],in:['length',.0254],yd:['length',.9144],kg:['mass',1],g:['mass',.001],lb:['mass',.45359237],oz:['mass',.028349523125],s:['time',1],min:['time',60],h:['time',3600],day:['time',86400],l:['volume',1],ml:['volume',.001],gal:['volume',3.785411784]};
export function convert({value,from,to}){if(!Number.isFinite(value)||typeof from!=='string'||typeof to!=='string')throw Error('Conversion needs a finite value, from, and to.');from=from.toLowerCase();to=to.toLowerCase();let result;
 if(['c','f','k'].includes(from)&&['c','f','k'].includes(to)){const c=from==='f'?(value-32)*5/9:from==='k'?value-273.15:value;if(c< -273.15)throw Error('Temperature cannot be below absolute zero.');result=to==='f'?c*9/5+32:to==='k'?c+273.15:c;}
 else{if(!Object.hasOwn(units,from)||!Object.hasOwn(units,to)||units[from][0]!==units[to][0])throw Error('Units must be supported and measure the same quantity.');result=value*units[from][1]/units[to][1];}
 if(!Number.isFinite(result))throw Error('Conversion overflow.');return {value,from,to,result,note:from==='gal'||to==='gal'?'US liquid gallon.':undefined};
}
export function dateTime(zone=''){const timezone=zone.trim()||Intl.DateTimeFormat().resolvedOptions().timeZone;try{return {timezone,local:new Intl.DateTimeFormat('en-US',{dateStyle:'full',timeStyle:'long',timeZone:timezone}).format(new Date()),iso:new Date().toISOString(),source:'Device clock, not a network time service.'};}catch{throw Error('Use a valid timezone such as America/Chicago.');}}
