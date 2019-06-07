---
layout: post
title:  flutter的自动完成文本字段
tag: Autocomplete, Textfield
date: 2019-06-08
---

# [flutter的自动完成文本字段 ](http://github.com/felixlucien/flutter-autocomplete-textfield) 



## [查看Github/felixlucien/flutter-autocomplete-textfield](http://github.com/felixlucien/flutter-autocomplete-textfield)
## [立即下载 ️⬇️ ](https://codeload.github.com/felixlucien/flutter-autocomplete-textfield/zip/master) 


 
![](https://flutterawesome.com/content/images/2018/11/flutter-autocomplete-textfield.jpg)
 
>
> flutter的自动完成文本字段。
>

 
# autocomplete_textfield

An autocomplete textfield for flutter

# pull requests
Feel free to submit pull requests!
 
 ## Pub Package Can Be Found At
 
 [Pub Package](https://pub.dartlang.org/packages/autocomplete_textfield#-example-tab-)

 ## Breaking Changes

 TextField is set by default to call onSubmitted on a suggestion tap and also to clear the TextField on submit.

 These can both be disabled with submitOnSuggestionTap and clearOnSubmit respectively.
 
 ## Usage
 
 AutoCompleteTextField supports any data type suggestions
 
 `new AutoCompleteTextField<YOURDATATYPE>()`
 
The suggestions parameter must have data that matches `<YOURDATATYPE>`
 
 A global key of type `GlobalKey<AutoCompleteTextFieldState<T>>` is required so that the `clear()` method can be called to clear AutoCompleteTextField.

# Strings and itemFilter

Filtering is case sensitive so when using strings a common implementation of itemFilter is .   
`
itemFilter: (item, query) {
  return item.toLowerCase().startsWith(query.toLowerCase());
}
`

![](https://raw.githubusercontent.com/felixlucien/flutter-autocomplete-textfield/master/textfield-demo.gif)

