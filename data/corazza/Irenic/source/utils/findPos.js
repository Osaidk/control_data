//Gets the position of a DOM element on the page.
Irenic.findPos = function(obj)
{
	var curleft = curtop = 0;
	
	if (obj.offsetParent) 
	{
		do 
		{
			curleft += obj.offsetLeft;
			curtop += obj.offsetTop;	
		} 
		while (obj = obj.offsetParent);
	}
	return [curleft,curtop];
}
