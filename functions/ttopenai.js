import { calculateOmuIndex } from './openaiApi.js';

calculateOmuIndex("渋谷").then(result => {
    console.log(result);
});

