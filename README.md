# at-storage

AngularJS 的storage服务。

## service

* atStorage
 * isSupport
 * set
 * get
 * getALl
 * has
 * keys
 * remove
 * clearAll
 * hasExpired
 * watch
 * init
 * cookie
 * storageType

## 详解

### atStorage.isSupport

> type:{boolean}

检测是否支持localStorage或sessionStorage

IE兼容性：IE9+(Angular已经不支持I8，所以这个必然是true...)

### atStorage.set(key, value, expiredTime)

存储

> type:{function}

> arguments: 

> * key{string}
>  * 你要存储的key
> * value{*}
>  * 你要存储的value，可以是任意值，除了function
> * expiredTime[number]
>  * 过期时间，单位是毫秒(mm) ,可选参数，不填则使用默认时间2个月

> return:{*}
> 返回一个已经包装的对象

### atStorage.get(key)

通过key，获取储存的值

> type:{function}

> arguments:

> * key
>  * 你要获取的key

> return:{*}
> 返回存储的值，如果不存在，或者存储的数据已过期，则返回undefined

### atStorage.getALl()

返回所有存储的值

> type:{function}

> arguments:[none]
> 没有参数

> return:{array}
> 以数组的形式，返回所有储存的数据，如果为空，或者全部过期，则返回空数组

### atStorage.remove(key)

删除某个键值

> type:{function}

> arguments:
> * key:{string},传入的key

> return:{string}
> 返回你删除了哪个key

### atStorage.clearAll()

> type:{function}

> arguments:[none]

> return:{array}
> 返回一个数组，里面是你删除了那些key

### atStorage.hasExpired()

检测一个数据，是否过期

> type:{function}

> arguments:
> * key:{string},检查的key值

> return:{boolean}
> 返回tru或false，true表示已过期，fals表示未过期

### atStorage.watch(key,watcher,$scope)

监听某个值的变化

localStorage使用监听onstorage事件

``bug:``sessionStorage无法监听onstorage事件，暂时无效(有大大告诉我么，为什么sessionStorage的onstorage事件无效？)

cookie使用轮询的方式，间隔1500ms，没办法，原生api本根无法监听cooki，不过估计也用不到吧？angular最低支持IE9，IE9已经支持了localStorage

``bug:``IE和低版本firefox下，“发送消息”的窗口本身，也会触发watcher，chrome下只触发其他窗口，浏览器本身问题(这是ie的bug2333)

#### 应用场景

##### 多窗口通信

比如当A页面登陆，然后“发送消息”给B，C，D窗口，执行登陆操作

再比如网站换肤，用户在A窗口选择了黑色，“发送消息”给B，C，D窗口，执行换肤操作

> type:{function}

> arguments:
> * key:{string}，你要监听的key,
> * watcher:{function(newValue,oldValue,eventObject)},当发生变化时，要执行的函数
> * $scope:[object]
>  * 如果是在服务中监听，则不用传入这个参数
>  * 如果在控制器中监听，传入当前控制器的$scope，当控制器被销毁时(destroy)，监听函数也会被销毁，如果不传入，则是全局监听，在这里我推荐在服务中监听

> return:{*}

### atStorage.init()

初始化服务，检测那些值已经过期，然后删除

> type:{function}

> arguments:[none]

> return:{array}
> 返回一个数组，里面包含这那些key已过期

### atStorage.cookie

操作cooki的对象，当浏览器不支持localStorage或sessionStorage时的备选方案

当然也可以操作cookie

> type:{object}

> attr: 跟atStorage拥有一样的方法，一样的参数

### atStorage.storageType

获取当前储存的方式

> type:{string}
> * 只有三种可能
>  * localStorage
>  * sessionStorage
>  * cookie

## provider

在config阶段运行的配置

### atStorageProvider.setExpiredTime(time)

设置默认的过期时间,默认两个月（``default:1000 * 60 * 60 * 24 * 60``）

当使用``atStorage.set(key,value)``不设置过期时间的时候，就使用这个默认时间

> type:{function}

> arguments:
> * time:{number}，过期时间，单位为毫秒ms

> return:{atStorageProvider}，可链式调用

### atStorageProvider.setPrefix(prefix)

设置key值的前缀，默认：`atStorage`

> type:{function}

> arguments:
> * prefix:{string}

> return:{atStorageProvider}，可链式调用

### atStorageProvider.setPrefixLink(prefixLink)

设置前缀(prefix)，与ke之间的链接符，默认：``-``

默认前缀和默认链接符，会组成这样``atStorage-key``

> type:{function}

> arguments:
> * prefixLink:{string}

> return:{atStorageProvider}，可链式调用

### atStorageProvider.setStorageType(type)

设置储存方式

提示：当选择使用sessionStorage来储存时，``atStorage.watch``失效

> type:{function}

> arguments:
> * type:{string}，只接受两个字符串，要么是``localStorage``，要么是``sessionStorage``

> return:{atStorageProvider}，可链式调用

### atStorageProvider.autoInit(auto)

是否自动初始化

自动：在angula加载该服务后，自动检测哪些缓存是过期的，并且删除

手动：自己执行``atStorage.init()``去检测过期缓存，并且删除

> type:{function}

> arguments:
> * auto:{boolean}，是否自动初始化，为tru表示自动，为false表示手动
