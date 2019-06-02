---
layout: post
title:  【译】Flutter json序列号与反序列化
tag: flutter
date: 2018-11-26 

---

很难想象一个移动应用程序不需要与Web服务器通信或在某些时候容易存储结构化数据。制作网络连接的应用程序时，迟早需要消耗一些好的旧JSON。


本指南介绍了如何在Flutter中使用JSON。它涵盖了在不同场景中使用哪种JSON解决方案，以及原因。

##  哪种JSON序列化方法适合我？

本文介绍了使用JSON的两种常规策略：

*   手动序列化
*   使用代码生成进行自动序列化

不同的项目具有不同的复杂性和用例。对于较小的概念验证项目或快速原型，使用代码生成器可能过度。对于具有更多复杂性的多个JSON模型的应用程序，手动编码很快就会变得乏味，重复，并且适用于许多小错误。

### [](https://flutter.io/docs/development/data-and-backend/json#use-manual-serialization-for-smaller-projects)对较小的项目使用手动序列化

手动JSON解码是指使用内置的JSON解码器 `dart:convert`。它涉及将原始JSON字符串传递给`json.decode()` 方法，然后`Map<String, dynamic>` 在方法返回时查找所需的值。它没有外部依赖性或特定的设置过程，它有利于快速验证概念。

当项目变大时，手动解码效果不佳。手动编写解码逻辑可能变得难以管理且容易出错。如果在访问不存在的JSON字段时出现拼写错误，则代码会在运行时抛出错误。

如果您的项目中没有很多JSON模型，并且希望快速测试概念，那么手动序列化可能就是您想要的方式。有关手动编码的示例，请参阅 [使用dart：convert手动序列化JSON](https://flutter.io/docs/development/data-and-backend/json#manual-encoding)。

### [](https://flutter.io/docs/development/data-and-backend/json#use-code-generation-for-medium-to-large-projects)使用代码生成中大型项目

使用代码生成的JSON序列化意味着使用外部库为您生成编码样板。进行一些初始设置后，您将运行一个文件监视器，从您的模型类生成代码。例如， [json_serializable](https://pub.dartlang.org/packages/json_serializable)和 [built_value](https://pub.dartlang.org/packages/built_value) 就是这些类型的库。

这种方法适用于较大的项目。不需要手写的样板文件，并且在编译时捕获访问JSON字段时的拼写错误。代码生成的缺点是它需要一些初始设置。此外，生成的源文件可能会在项目导航器中产生视觉混乱。

当您拥有中型或大型项目时，您可能希望使用生成的代码进行JSON序列化。要查看基于JSON编码的代码生成示例，请参阅 [使用代码生成库序列化JSON](https://flutter.io/docs/development/data-and-backend/json#code-generation)。

## [](https://flutter.io/docs/development/data-and-backend/json#is-there-a-gsonjacksonmoshi-equivalent-in-flutter)Flutter中是否有GSON / Jackson / Moshi等价物？

简单回答是不。

这样的库需要使用运行时反射，这在Flutter中被禁用。运行时反射会干扰*树抖动*，Dart已经支持了很长时间。在树摇动的情况下，您可以从发布版本中“摆脱”未使用的代码。这显着优化了应用程序的大小。

由于反射使得默认情况下隐式使用所有代码，因此使树难以振动。这些工具无法知道运行时哪些部分未使用，因此冗余代码很难剥离。使用反射时，应用程序大小无法轻松优化。

** dartson怎么样？**

该[dartson](https://pub.dartlang.org/packages/dartson)库使用运行时反射，这使得它不兼容flutter。

虽然您不能在Flutter中使用运行时反射，但是某些库为您提供了类似的易用API，而是基于代码生成。[代码生成库](https://flutter.io/docs/development/data-and-backend/json#code-generation)部分更详细地介绍了此方法。

## [](https://flutter.io/docs/development/data-and-backend/json#serializing-json-manually-using-dartconvert)使用dart：convert手动序列化JSON

Flutter中的基本JSON编码非常简单。Flutter有一个内置 `dart:convert`库，包括一个简单的JSON编码器和解码器。

以下是简单用户模型的示例JSON。

```
{
  "name": "John Smith",
  "email": "john@example.com"
}

```

有了`dart:convert`，您可以通过两种方式对此JSON模型进行编码。

### [](https://flutter.io/docs/development/data-and-backend/json#serializing-json-inline)序列化JSON内联

通过查看[dart：转换JSON文档](https://api.dartlang.org/stable/dart-convert/JsonCodec-class.html)，您将看到可以通过调用`json.decode`方法解码JSON ，并使用JSON字符串作为方法参数。

```
Map<String, dynamic> user = json.decode(json);

print('Howdy, ${user['name']}!');
print('We sent the verification link to ${user['email']}.');

```

不幸的是，`json.decode()`只返回a `Map<String, dynamic>`，这意味着在运行时之前您不知道值的类型。使用这种方法，您将丢失大多数静态类型语言功能：类型安全性，自动完成以及最重要的编译时异常。您的代码将立即变得更容易出错。

例如，无论何时访问`name`或`email`字段，都可能会快速引入拼写错误。由于JSON存在于地图结构中，编译器不知道的拼写错误。

### [](https://flutter.io/docs/development/data-and-backend/json#serializing-json-inside-model-classes)在模型类中序列化JSON

通过引入`User`在此示例中调用的普通模型类来对抗前面提到的问题。在`User`课堂上，你会发现：

*   一个`User.fromJson`构造函数，构造一个新的`User`从地图结构实例。
*   一种`toJson`将`User`实例转换为地图的方法。

使用这种方法，*调用代码*可以具有类型安全性，`name`和`email`字段的自动完成以及编译时异常。如果您使用拼写错误或将字段视为`int`s而不是`String`s，则应用程序将无法编译，而不是在运行时崩溃。

**user.dart**

```
class User {
  final String name;
  final String email;

  User(this.name, this.email);

  User.fromJson(Map<String, dynamic> json)
      : name = json['name'],
        email = json['email'];

  Map<String, dynamic> toJson() =>
    {
      'name': name,
      'email': email,
    };
}

```

解码逻辑的责任现在在模型本身内部移动。使用这种新方法，您可以轻松解码用户。

```
Map userMap = json.decode(json);
var user = new User.fromJson(userMap);

print('Howdy, ${user.name}!');
print('We sent the verification link to ${user.email}.');

```

要对用户进行编码，请将`User`对象传递给`json.encode`方法。您不需要调用该`toJson`方法，因为`json.encode` 已经为您完成了。

```
String json = json.encode(user);

```

使用这种方法，调用代码根本不必担心JSON序列化。但是，模型类仍然必须。在生产应用程序中，您需要确保序列化正常工作。在实践中，这些`User.fromJson`和`User.toJson` 方法都需要进行单元测试以验证正确的行为。

但是，现实场景通常不那么简单。您不太可能使用如此小的JSON响应。嵌套的JSON对象也是常用的。

如果有一些东西可以为您处理JSON编码和解码，那就太好了。幸运的是，有！

## [](https://flutter.io/docs/development/data-and-backend/json#serializing-json-using-code-generation-libraries)使用代码生成库序列化JSON

虽然还有其他库可用，但本指南使用 [json_serializable包](https://pub.dartlang.org/packages/json_serializable)，这是一个自动生成的源代码生成器，可为您生成JSON序列化样板。

由于序列化代码不再是手动或手动维护的，因此可以最大限度地降低在运行时出现JSON序列化异常的风险。

### [](https://flutter.io/docs/development/data-and-backend/json#setting-up-json_serializable-in-a-project)在项目中设置json_serializable

要包含`json_serializable`在项目中，您需要一个常规依赖项和两个*dev依赖项*。简而言之，*dev依赖项* 是我们的应用程序源代码中未包含的依赖项 - 它们仅在开发环境中使用。

可以通过遵循 JSON可序列化示例中[的pubspec文件](https://raw.githubusercontent.com/dart-lang/json_serializable/master/example/pubspec.yaml)来查看这些必需依赖项的最新版本 。

**pubspec.yaml**

```
dependencies:
  # Your other regular dependencies here
  json_annotation: ^2.0.0

dev_dependencies:
  # Your other dev_dependencies here
  build_runner: ^1.0.0
  json_serializable: ^2.0.0

```

`flutter packages get`在项目根文件夹中运行（或单击 编辑器中的**Packages Get**）以在项目中使用这些新的依赖项。

### [](https://flutter.io/docs/development/data-and-backend/json#creating-model-classes-the-json_serializable-way)

以json_serializable方式创建模型类
以下显示如何将User类转换为一个类json_serializable 。为简单起见，此代码使用先前示例中的简化JSON模型。

user.dart
```
class User {
  final String name;
  final String email;

  User(this.name, this.email);

  User.fromJson(Map<String, dynamic> json)
      : name = json['name'],
        email = json['email'];

  Map<String, dynamic> toJson() =>
    {
      'name': name,
      'email': email,
    };
}
```

采用这种设置，源代码生成器用于编码和将编码生成代码`name`和`email`从JSON字段。

如果需要，还可以轻松自定义命名策略。例如，如果API返回带有*snake_case的*对象，并且您想在模型中使用 *lowerCamelCase*，则可以使用`@JsonKey`带有name参数的注释：

```
/// Tell json_serializable that "registration_date_millis" should be
/// mapped to this property.
@JsonKey(name: 'registration_date_millis')
final int registrationDateMillis;

```

### [](https://flutter.io/docs/development/data-and-backend/json#running-the-code-generation-utility)

### 运行代码生成实用程序

`json_serializable`第一次创建类时，您将收到类似于下图所示的错误。

![当模型类的生成代码尚不存在时，IDE警告。](http://upload-images.jianshu.io/upload_images/1091358-0f298d9cdea7c13d.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

这些错误完全正常，仅仅是因为模型类的生成代码尚不存在。要解决此问题，请运行生成序列化样板的代码生成器。

有两种运行代码生成器的方法。

#### [](https://flutter.io/docs/development/data-and-backend/json#one-time-code-generation)一次性代码生成

通过`flutter packages pub run build_runner build`在项目根目录中运行，可以在需要时为模型生成JSON序列化代码。这会触发一次性构建，该构建遍历源文件，选择相关文件，并为它们生成必要的序列化代码。

虽然这很方便，但如果您不必每次在模型类中进行更改时都必须手动运行构建，那将是很好的。

#### [](https://flutter.io/docs/development/data-and-backend/json#generating-code-continuously)不断生成代码

一个*观察者*，使我们的源代码生成的过程更加方便。它会监视项目文件中的更改，并在需要时自动构建必要的文件。通过`flutter packages pub run build_runner watch`在项目根目录中运行来启动观察程序 。

启动观察者一次并让它在后台运行是安全的。

### [](https://flutter.io/docs/development/data-and-backend/json#consuming-json_serializable-models)使用json_serializable模型

要以这种`json_serializable`方式解码JSON字符串，您实际上没有对我们以前的代码进行任何更改。

```
Map userMap = json.decode(json);
var user = User.fromJson(userMap);

```

编码也是如此。调用API与以前相同。

```
String json = json.encode(user);

```

有了`json_serializable`，您可以忘记`User`该类中的任何手动JSON序列化 。源代码生成器创建一个名为的文件`user.g.dart`，该文件具有所有必需的序列化逻辑。您不再需要编写自动化测试来确保序列化工作 - 现在*图书馆有责任*确保序列化正常工作。


##  进一步参考

有关更多信息，请参阅以下资源：

*   [JsonCodec文档](https://api.dartlang.org/stable/dart-convert/JsonCodec-class.html)
*   [Pub中的json_serializable包](https://pub.dartlang.org/packages/json_serializable)
*   [GitHub中的json_serializable示例](https://github.com/dart-lang/json_serializable/blob/master/example/lib/example.dart)
