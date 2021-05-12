var myChart = null; //Create null variable to hold chart later
    function updateProjection(){
        console.log("Submitted.")
    // If myChart already exists, you need to destroy it before trying to update it or it screws up.
    // This checks if myLineChart is not null, if so, then destroy the chart.
    if(!!myChart){
       myChart.destroy();
       }
    
    // Set up canvas for chart
    var canvas =document.getElementById("projection-chart")
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);

    //Get the values from the form that the user has entered and submitted 
	var current_age=parseInt(document.getElementById("current_age").value);
	var retire_age=parseInt(document.getElementById("retire_age").value);
	var years_in_retirement=parseInt(document.getElementById("retire_length").value);
	var step= 1;
	var current_balance =parseInt(document.getElementById("current_savings").value.replace(/,/g, ''));
	var current_salary = parseInt(document.getElementById("current_salary").value.replace(/,/g, ''));
	var annual_contribution =parseFloat(document.getElementById("perc_contribution").value)/100*current_salary; 
    var retire_spend=parseInt(document.getElementById("retire_spend").value.replace(/,/g, ''));
	var investment_growth_rate = parseInt(document.getElementById("current_interest_rate").value)/100;
	var salary_growth_rate = .02;
	var post_retirement_salary_percentage =  1;
    var includeSS = document.getElementById("SS").checked;
    // Need to check social security age within range 
    var SS_age =parseInt(document.getElementById("SS_age").value);
	// For now assume SSage=67
    //SS_age = 67; 
	console.log(current_balance);

	
	//https://www.qualtrics.com/community/discussion/4368/using-getchoiceanswervalue-for-a-question-other-than-this
    var SSyearly_benefit=0;
	function estimateSS(SS_age){
        
        var years = [2020, 2019, 2018, 2017, 2016, 
                 2015, 2014, 2013, 2012, 2011, 
                 2010, 2009, 2008, 2007, 2006,
                 2005, 2004, 2003, 2002, 2001, 
                 2000, 1999, 1998, 1997, 1996, 
                 1995, 1994, 1993, 1992, 1991,
                 1990, 1989, 1988, 1987, 1986];
    
        // Data from 2019: https://www.ssa.gov/policy/docs/statcomps/supplement/2019/apnd.pdf
        var index_factors = [1, 1, 1, 1, 1.03,
                             1.05, 1.08, 1.12, 1.35, 1.17, 
                             1.21, 1.24, 1.22, 1.25, 1.30,
                             1.36, 1.41, 1.48, 1.51, 1.53, 
                             1.57, 1.65, 1.74, 1.83, 1.94,
                             2.04, 2.12, 2.18, 2.19, 2.31,
                             2.39, 2.50, 2.60, 2.73, 2.91]
        var max_earnings = [128400, 128400, 128400, 127200, 118500,
                           118500, 117000, 113700, 110100, 106800,
                           106800, 106800, 102000, 97500, 94200,
                           90000, 87900, 87000, 84900, 80400,
                           76200, 72600, 68400, 65400, 62700, 
                           61200, 60600, 57600, 55500, 53400,
                           51300, 48000, 45000, 43800, 42000]; 
        // Data pulled from form
        var working_years = current_age-22;
        var working_months = working_years*12; 

        // Estimate salaries over time from starting and current salaries
        var exponential_salary_over_time= [];
        for (var i=0; i <=(working_years);i++){
            if(i==0){
                exponential_salary_over_time.push(current_salary);
            }else{
                //Assumes 2% salary growth per year
                exponential_salary_over_time.push(Math.floor(exponential_salary_over_time[i-1]/1.02));
            }
        }
        var salary_over_time = exponential_salary_over_time;
        var working_months = working_years*12; 

        // Calculate eligible earnings based on salary estimates and max eligible earnings
        var eligible_earnings = [];
        for (var i=0; i <(working_years);i++){
            if(max_earnings[i]>=salary_over_time[i]){
                eligible_earnings.push(salary_over_time[i]);
            }else{
                eligible_earnings.push(max_earnings[i]);        
            }
        }

        // Calculate indexed earnings based on estimated eligbile earnings and index factors
        var indexed_earnings = 0;
        for (var i=0; i <(working_years);i++){
             indexed_earnings = indexed_earnings+eligible_earnings[i]*index_factors[i];
         }

        // Calculate average indexed monthly earnings
        var ave_indexed_monthly_earnings = Math.floor(indexed_earnings/working_months);

        
        // Calculate full estimated monthly benefit (at 66 years and 4 months)
        var monthly_benefit = 0;
        if(includeSS==true){
            if(ave_indexed_monthly_earnings<=926){
                monthly_benefit=Math.floor(ave_indexed_monthly_earnings*.9);
            }else if(ave_indexed_monthly_earnings<=5583){
                monthly_benefit=Math.floor(926*.9+(ave_indexed_monthly_earnings-926)*.32);
            }else{
                monthly_benefit=Math.floor(926*.9+5583*.32+(ave_indexed_monthly_earnings-5583)*.15);
            }
        }
        // Yearly benefit at retirement
        SSyearly_benefit = 12*monthly_benefit; 
   
        // Statements to print to console for troubleshooting     
        console.log(salary_over_time);

        	  
    }
    // 
    if(includeSS){
    estimateSS(SS_age);}
        
	// Function to generate an array from min to max by step intervals
    // (Code modified from https://medium.com/javascript-in-plain-english/javascript-algorithm-generate-range-of-integers-73f739b4871)
	function generateRange(min, max, step){
  		let arr = [];
  		for(let i = min; i <= max; i += step){arr.push(i);}
 		 return arr;
	}
	
	// Create array of ages from current age to retirement plus length of retirement
	var ages = generateRange(current_age,retire_age+years_in_retirement,step);
	   
    // Function to calculate savings balance - Assume annual percent contribution
    function calculateSavingsBalance(age_array,
								  retire_age,
								  years_in_retirement,
                                  salary, 
								  salary_growth, 
								  annual_contribution,
                                  current_balance, 
                                  invest_growth, 
                                  post_retire_perc,
                                  retire_spend, 
                                  SSyearly_benefit,
                                  SS_age){
		let SavingsBal_arr = [current_balance];
        let RetireAge_arr = [retire_age];
		let current_salary = salary;
		let current_age=age_array[0];
	    let effective_1plusr =1;
        var spend = 0;
        let spend_arr = [];
        let SS_arr = [];
        
        for(i=1 ; i<age_array.length ; i++){
            current_age=age_array[i];
            // PRE-RETIREMENT
            if(current_age<retire_age){
                current_salary = Math.round(current_salary*(1+salary_growth));
                SavingsBal_arr.push(Math.round(SavingsBal_arr[i-1]*(1+invest_growth)+annual_contribution));	
            // FIRST YEAR RETIREMENT    
            }else if(current_age>=retire_age){
                var retire_start_bal = SavingsBal_arr[i-1];
                if(current_age<SS_age){ //If retired but less than SS age
                    spend = retire_spend;
                    SS_arr.push(0);
                    
                }else{                  //If retired and at or more than SS age
                    if(SavingsBal_arr[i-1]>=retire_spend-SSyearly_benefit){//If enough money in retirement account, then spend is 
                        spend = retire_spend-SSyearly_benefit;
                    }else{ //if not enough money in retirement account, then spend is
                       //spend = SSyearly_benefit+SavingsBal_arr[i-1];
                       spend = SavingsBal_arr[i-1];

                       
                       }
                    SS_arr.push(SSyearly_benefit);
                }
                // Record spend amount in array
                spend_arr.push(spend);
                //Calculate Savings Balance
                SavingsBal_arr.push(Math.round((SavingsBal_arr[i-1]-spend)*(1+invest_growth)));
                //Record current age
                RetireAge_arr.push(current_age);
            }
            }

        return [RetireAge_arr, spend_arr, SS_arr]; 
        }

		     
  
    
        
	// Find the array of balances using the calculateSavingsBalance function and input parameters
	var calculateOutput = calculateSavingsBalance(ages, 
										   retire_age,
										   years_in_retirement,
										   current_salary,
										   salary_growth_rate,
										   annual_contribution, 
										   current_balance,
										   investment_growth_rate,
										   post_retirement_salary_percentage, 
                                           retire_spend,
                                           SSyearly_benefit,
                                           SS_age); 
    //Pull arrays from output array
    var RetireAge_arr = calculateOutput[0];
    var spend_arr = calculateOutput[1];
    var SS_arr = calculateOutput[2];
    //
	console.log("Retirement age is "+RetireAge_arr);
	console.log("Retirement spend from funds is "+spend_arr);
    console.log("SS funds is "+SS_arr);
  	// Check if negative number 
	function checkneg(amount) {
 		 return amount <= 0;
	}
 

	
	// Format  Saving Data for Chart
    // See https://bl.ocks.org/tbpgr/304782f57b6f0a0fb8e7 for reference
	var retireIncomeData = {
		labels: RetireAge_arr,					// x-axis data
  	datasets: [
        {
            label: "Social Security Income", 		// y-axis label
            data: SS_arr,				       // y-axis data
            fill: true,
            backgroundColor: 'rgba(78, 118, 139,0.5)'
        },
        {
            label: "Retirement Fund Income", 		// y-axis label
            data: spend_arr,				       // y-axis data
            fill: true,
            backgroundColor: 'rgba(224, 169, 139, 0.5)'
        }
        
]};
	
	// Create the line chart
    // See for example stacked line chart https://codepen.io/natenorberg/pen/WwqRar
    // See also https://www.chartjs.org/docs/latest/charts/mixed.html
    // See also https://www.chartjs.org/docs/latest/charts/line.html#line-styling
        myChart = new Chart(document.getElementById("projection-chart"), 

    {
        type: 'bar',						 // Chart type (line, bar, scatter, etc)
		data: retireIncomeData,    				 // Formatted data from above
		options: {
          responsive: false,
		  legend: { display: false },
		  tooltips: {
      		mode: 'index',
      		intersect: false,
    		},
		  
			scales: {
               
				xAxes:[{
                    stacked: true,
				    ticks: {
           			  autoSkip: true,
					   maxTicksLimit: 20}
				}],
                yAxes:[{
                stacked: true
            }]
			}
		}    
        });
    }